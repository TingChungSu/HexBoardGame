using System;
using System.Collections.Generic;
using System.Text;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Collections;

namespace MyWebeSocket
{
    public class WebSocketServer
    {
        private System.Object lockGameId = new System.Object();
        private System.Object lockWaitingQueue = new System.Object();
        private int gameId = 66666;
        private Dictionary<Socket, WebSocketConnection> clients = new Dictionary<Socket, WebSocketConnection>();
        private Dictionary<Int32, GameRoom> rooms = new Dictionary<Int32, GameRoom>();
        private List<SocketMessage> msgPool = new List<SocketMessage>();
        private Queue waitingQueue = new Queue();
        public void Run(int port)
        {
            try
            {
                Thread serverSocketThraed = new Thread(() =>
                {
                    Socket server = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                    server.Bind(new IPEndPoint(IPAddress.Any, port));
                    server.Listen(256);
                    server.BeginAccept(new AsyncCallback(Accept), server);
                });

                serverSocketThraed.Start();
                Console.WriteLine("Server is ready: " + GetLocalIPAddress() + ":" + port);
                Broadcast();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error :\r\n\t" + ex.ToString());
            }
        }
        private void Broadcast()
        {
            Thread broadcast = new Thread(() => {
                while (true)
                {
                    Thread.Sleep(5000);

                    //if (!isClear)
                    //{
                    //    byte[] msg = PackageServerData(msgPool[0]);
                    //    foreach (KeyValuePair<Socket, WebSocketConnection> cs in clients)
                    //    {
                    //        Socket client = cs.Key;
                    //        try
                    //        {
                    //            if (client.Poll(100, SelectMode.SelectWrite))
                    //            {
                    //                client.Send(msg, msg.Length, SocketFlags.None);
                    //            }
                    //        }
                    //        catch (Exception ex)
                    //        {
                    //            Console.WriteLine(ex.Message);
                    //        }
                    //    }
                    //    msgPool.RemoveAt(0);
                    //    isClear = msgPool.Count == 0 ? true : false;
                    //}
                }
            });

            broadcast.Start();
        }

        private void Accept(IAsyncResult result)
        {
            Socket server = result.AsyncState as Socket;
            Socket client = server.EndAccept(result);
            try
            {
                //处理下一个客户端连接
                server.BeginAccept(new AsyncCallback(Accept), server);
                byte[] buffer = new byte[1024];
                //接收客户端消息
                client.BeginReceive(buffer, 0, buffer.Length, SocketFlags.None, new AsyncCallback(Recieve), client);
                WebSocketConnection info = new WebSocketConnection();
                info.Id = client.RemoteEndPoint;
                info.handle = client.Handle;
                info.buffer = buffer;
                info.socket = client;
                info.roomId = 0;
                //把客户端存入clientPool
                this.clients.Add(client, info);
                Console.WriteLine(string.Format("Client {0} connected", client.RemoteEndPoint));
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error :\r\n\t" + ex.ToString());
            }
        }
        private void disconnect(Socket client)
        {
            try
            {
                if (clients.ContainsKey(client))
                {
                    if (rooms.ContainsKey(clients[client].roomId))
                    {
                        byte[] content = PackageServerData("#EnemyGiveUp");
                        try
                        {
                            if (clients[client].IsCreater)
                            {
                                if (rooms[clients[client].roomId].enemy != null)
                                {
                                    Console.WriteLine(clients[client].roomId + " Creater disconnet.");
                                    rooms[clients[client].roomId].enemy.socket.Send(content, content.Length, SocketFlags.None);
                                    rooms[clients[client].roomId].enemy.socket.Disconnect(true);
                                    clients.Remove(rooms[clients[client].roomId].enemy.socket);
                                }
                            }
                            else
                            {
                                if (rooms[clients[client].roomId].creater != null)
                                {
                                    Console.WriteLine(clients[client].roomId + " Enemy disconnet.");
                                    rooms[clients[client].roomId].creater.socket.Send(content, content.Length, SocketFlags.None);
                                    rooms[clients[client].roomId].creater.socket.Disconnect(true);
                                    clients.Remove(rooms[clients[client].roomId].creater.socket);
                                }
                            }

                            rooms.Remove(clients[client].roomId);
                        }
                        catch (Exception exx)
                        {
                            Console.WriteLine(exx);
                        }
                    }

                    lock (lockWaitingQueue)
                    {
                        if (waitingQueue.Contains(client))
                        {
                            waitingQueue.Dequeue();
                        }
                    }

                    Console.WriteLine("Client {0} disconnet", clients[client].Name);
                    client.Disconnect(false);
                    clients.Remove(client);
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("disconnect Error: " + ex);
            }

        }

        private void Recieve(IAsyncResult result)
        {
            Socket client = result.AsyncState as Socket;

            if (client == null || !clients.ContainsKey(client))
            {
                return;
            }
            try
            {
                if (!SocketConnected(client))
                {
                    disconnect(client);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Recieve Error:" + ex);
            }

            try
            {
                int length = client.EndReceive(result);
                byte[] buffer = clients[client].buffer;

                //接收消息
                client.BeginReceive(buffer, 0, buffer.Length, SocketFlags.None, new AsyncCallback(Recieve), client);
                string msg = Encoding.UTF8.GetString(buffer, 0, length);

                if (!clients[client].IsHandShaked && msg.Contains("Sec-WebSocket-Key"))
                {
                    client.Send(PackageHandShakeData(buffer, length));
                    clients[client].IsHandShaked = true;
                    return;
                }

                msg = AnalyzeClientData(buffer, length);

                SocketMessage sm = new SocketMessage();
                sm.Client = clients[client];
                sm.Time = DateTime.Now;

                Regex reg = new Regex(@"{<(.*?)>}");
                Match m = reg.Match(msg);
                if (m.Value != "")
                { //处理客户端传来的用户名
                    clients[client].NickName = Regex.Replace(m.Value, @"{<(.*?)>}", "$1");
                    sm.isLoginMessage = true;
                    sm.Message = "login!";
                    Console.WriteLine("{0} login @{1}", client.RemoteEndPoint, DateTime.Now);
                }
                else
                { //处理客户端传来的普通消息
                    HandleCmd(client, msg);
                    sm.isLoginMessage = false;
                    sm.Message = msg;
                    Console.WriteLine("{0} @ {1}\r\t{2}", clients[client].Name, DateTime.Now, sm.Message);
                }
                msgPool.Add(sm);

            }
            catch (Exception ex)
            {
                try
                {
                    disconnect(client);
                }
                catch (Exception exx)
                {
                    Console.WriteLine(exx);
                }
            }
        }
        private void HandleCmd(Socket client, String cmd)
        {
            try
            {
                SocketMessage sm = new SocketMessage();
                sm.Client = clients[client];
                sm.Time = DateTime.Now;
                sm.isLoginMessage = false;
                if (cmd.StartsWith("<NewGame>"))
                {
                    Console.WriteLine("<NewGame>"+ gameId);
                    int size = Convert.ToInt32(cmd.Substring(9));
                    lock (lockGameId)
                    {
                        sm.Message = "#NewGame" + gameId + "";
                        clients[client].roomId = gameId;
                        GameRoom room = new GameRoom(clients[client], gameId, size);
                        this.rooms.Add(gameId, room);
                        gameId ++;
                    }
                    clients[client].IsCreater = true;

                    byte[] msgs = PackageServerData(sm);
                    client.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<EnterGame>"))
                {
                    //<EnterGame>1
                    String roomId = cmd.Substring(11);
                    Console.WriteLine("<EnterGame>"+ roomId);
                    Console.WriteLine(roomId);
                    if (rooms.ContainsKey(Convert.ToInt32(roomId)) && rooms[Convert.ToInt32(roomId)].enemy == null)
                    {
                        rooms[Convert.ToInt32(roomId)].enemy = clients[client];
                        sm.Message = "#GameStart"+rooms[Convert.ToInt32(roomId)].size;
                        clients[client].roomId = Convert.ToInt32(roomId);
                        byte[] msgs = PackageServerData(sm);
                        client.Send(msgs, msgs.Length, SocketFlags.None);
                        rooms[Convert.ToInt32(roomId)].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                        clients[client].IsCreater = false;
                    }
                    else
                    {
                        Console.WriteLine("rooms.ContainsKey(Convert.ToInt32(roomId):" + rooms.ContainsKey(Convert.ToInt32(roomId)));

                        String msg = "#Msg" + "InvalidRoomId";
                        byte[] msgs = PackageServerData(msg);
                        client.Send(msgs, msgs.Length, SocketFlags.None);
                    }
                }
                else if (cmd.StartsWith("<Place>"))
                {
                    Console.WriteLine("<Place>");
                    String pix = cmd.Substring(7);
                    sm.Message = "#Place" + pix;
                    byte[] msgs = PackageServerData(sm);
                    if (clients[client].IsCreater)
                        rooms[clients[client].roomId].enemy.socket.Send(msgs, msgs.Length, SocketFlags.None);
                    else
                        rooms[clients[client].roomId].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<EndGame>"))
                {
                    Console.WriteLine("<EndGame>");
                    String pix = cmd.Substring(7);
                    sm.Message = "#EndGame" + pix;
                    byte[] msgs = PackageServerData(sm);
                    rooms[clients[client].roomId].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                    rooms[clients[client].roomId].enemy.socket.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<Undo>"))
                {
                    Console.WriteLine("<Undo>");
                    String pix = cmd.Substring(6);
                    sm.Message = "#Undo" + pix;
                    byte[] msgs = PackageServerData(sm);
                    if (clients[client].IsCreater)
                        rooms[clients[client].roomId].enemy.socket.Send(msgs, msgs.Length, SocketFlags.None);
                    else
                        rooms[clients[client].roomId].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<Surrender>"))
                {
                    Console.WriteLine("<Surrender>");
                    sm.Message = "#Surrender";
                    byte[] msgs = PackageServerData(sm);
                    if (clients[client].IsCreater)
                        rooms[clients[client].roomId].enemy.socket.Send(msgs, msgs.Length, SocketFlags.None);
                    else
                        rooms[clients[client].roomId].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<ReStart>"))
                {
                    Console.WriteLine("<ReStart>");
                    sm.Message = "#ReStart";
                    byte[] msgs = PackageServerData(sm);
                    if (clients[client].IsCreater)
                        rooms[clients[client].roomId].enemy.socket.Send(msgs, msgs.Length, SocketFlags.None);
                    else
                        rooms[clients[client].roomId].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<Msg>"))
                {
                    Console.WriteLine("<Msg>");
                    String msg = cmd.Substring(5);
                    sm.Message = "#Msg" + msg;
                    byte[] msgs = PackageServerData(sm);
                    if (clients[client].IsCreater)
                        rooms[clients[client].roomId].enemy.socket.Send(msgs, msgs.Length, SocketFlags.None);
                    else
                        rooms[clients[client].roomId].creater.socket.Send(msgs, msgs.Length, SocketFlags.None);
                }
                else if (cmd.StartsWith("<Bye>"))
                {
                    Console.WriteLine("<Bye>");
                    disconnect(client);
                }
                else if (cmd.StartsWith("<RandomRoom>"))
                {
                    Console.WriteLine("<RandomRoom>");
                    String msg = "#RandomRoom";
                    lock (lockWaitingQueue)
                    {
                        if (waitingQueue.Count > 0)
                        {
                            clients[client].IsCreater = false;
                            Socket creater = waitingQueue.Dequeue() as Socket;
                            clients[client].roomId = clients[creater].roomId;
                            rooms[clients[creater].roomId].enemy = clients[client];
                            byte[] msgsRed = PackageServerData(msg + "Red");
                            creater.Send(msgsRed, msgsRed.Length, SocketFlags.None);
                            byte[] msgsBlue = PackageServerData(msg + "Blue");
                            client.Send(msgsBlue, msgsBlue.Length, SocketFlags.None);
                        }
                        else
                        {
                            clients[client].IsCreater = true;
                            lock (lockGameId)
                            {
                                clients[client].roomId = gameId;
                                GameRoom room = new GameRoom(clients[client], gameId, 12);
                                this.rooms.Add(gameId, room);
                                gameId++;
                            }
                            waitingQueue.Enqueue(client);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }

        private byte[] PackageHandShakeData(byte[] handShakeBytes, int length)
        {
            string handShakeText = Encoding.UTF8.GetString(handShakeBytes, 0, length);
            string key = string.Empty;
            Regex reg = new Regex(@"Sec\-WebSocket\-Key:(.*?)\r\n");
            Match m = reg.Match(handShakeText);
            if (m.Value != "")
            {
                key = Regex.Replace(m.Value, @"Sec\-WebSocket\-Key:(.*?)\r\n", "$1").Trim();
            }

            byte[] secKeyBytes = SHA1.Create().ComputeHash(
                                     Encoding.ASCII.GetBytes(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"));
            string secKey = Convert.ToBase64String(secKeyBytes);

            var responseBuilder = new StringBuilder();
            responseBuilder.Append("HTTP/1.1 101 Switching Protocols" + "\r\n");
            responseBuilder.Append("Upgrade: websocket" + "\r\n");
            responseBuilder.Append("Connection: Upgrade" + "\r\n");
            responseBuilder.Append("Sec-WebSocket-Accept: " + secKey + "\r\n\r\n");

            return Encoding.UTF8.GetBytes(responseBuilder.ToString());
        }

        private string AnalyzeClientData(byte[] recBytes, int length)
        {
            if (length < 2)
            {
                return string.Empty;
            }

            bool fin = (recBytes[0] & 0x80) == 0x80; // 1bit，1表示最后一帧  
            if (!fin)
            {
                return string.Empty;// 超过一帧暂不处理 
            }

            bool mask_flag = (recBytes[1] & 0x80) == 0x80; // 是否包含掩码  
            if (!mask_flag)
            {
                return string.Empty;// 不包含掩码的暂不处理
            }

            int payload_len = recBytes[1] & 0x7F; // 数据长度  

            byte[] masks = new byte[4];
            byte[] payload_data;

            if (payload_len == 126)
            {
                Array.Copy(recBytes, 4, masks, 0, 4);
                payload_len = (UInt16)(recBytes[2] << 8 | recBytes[3]);
                payload_data = new byte[payload_len];
                Array.Copy(recBytes, 8, payload_data, 0, payload_len);

            }
            else if (payload_len == 127)
            {
                Array.Copy(recBytes, 10, masks, 0, 4);
                byte[] uInt64Bytes = new byte[8];
                for (int i = 0; i < 8; i++)
                {
                    uInt64Bytes[i] = recBytes[9 - i];
                }
                UInt64 len = BitConverter.ToUInt64(uInt64Bytes, 0);

                payload_data = new byte[len];
                for (UInt64 i = 0; i < len; i++)
                {
                    payload_data[i] = recBytes[i + 14];
                }
            }
            else
            {
                Array.Copy(recBytes, 2, masks, 0, 4);
                payload_data = new byte[payload_len];
                Array.Copy(recBytes, 6, payload_data, 0, payload_len);

            }

            for (var i = 0; i < payload_len; i++)
            {
                payload_data[i] = (byte)(payload_data[i] ^ masks[i % 4]);
            }

            return Encoding.UTF8.GetString(payload_data);
        }

        private byte[] PackageServerData(SocketMessage sm)
        {
            StringBuilder msg = new StringBuilder();
            //if (!sm.isLoginMessage)
            //{ //处理普通消息
            //    msg.AppendFormat("{0} @ {1}:\r\n    ", sm.Client.Name, sm.Time.ToShortTimeString());
            //    msg.Append(sm.Message);
            //}
            //else
            //{ //消息是login信息
            //    msg.AppendFormat("{0} login @ {1}", sm.Client.Name, sm.Time.ToShortTimeString());
            //}

            msg.Append(sm.Message);

            byte[] content = null;
            byte[] temp = Encoding.UTF8.GetBytes(msg.ToString());

            if (temp.Length < 126)
            {
                content = new byte[temp.Length + 2];
                content[0] = 0x81;
                content[1] = (byte)temp.Length;
                Array.Copy(temp, 0, content, 2, temp.Length);
            }
            else if (temp.Length < 0xFFFF)
            {
                content = new byte[temp.Length + 4];
                content[0] = 0x81;
                content[1] = 126;
                content[2] = (byte)(temp.Length & 0xFF);
                content[3] = (byte)(temp.Length >> 8 & 0xFF);
                Array.Copy(temp, 0, content, 4, temp.Length);
            }
            else
            {
                // 暂不处理超长内容  
            }

            return content;
        }

        private byte[] PackageServerData(String msg)
        {
            byte[] content = null;
            byte[] temp = Encoding.UTF8.GetBytes(msg.ToString());

            if (temp.Length < 126)
            {
                content = new byte[temp.Length + 2];
                content[0] = 0x81;
                content[1] = (byte)temp.Length;
                Array.Copy(temp, 0, content, 2, temp.Length);
            }
            else if (temp.Length < 0xFFFF)
            {
                content = new byte[temp.Length + 4];
                content[0] = 0x81;
                content[1] = 126;
                content[2] = (byte)(temp.Length & 0xFF);
                content[3] = (byte)(temp.Length >> 8 & 0xFF);
                Array.Copy(temp, 0, content, 4, temp.Length);
            }
            else
            {
                // 暂不处理超长内容  
            }
            
            return content;
        }

        public static string GetLocalIPAddress()
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork)
                {
                    return ip.ToString();
                }
            }
            throw new Exception("Local IP Address Not Found!");
        }

        public bool SocketConnected(Socket s)
        {
            bool part1 = s.Poll(1000, SelectMode.SelectRead);
            bool part2 = (s.Available == 0);
            if (part1 && part2)
                return false;
            else
                return true;
        }
    }
}
