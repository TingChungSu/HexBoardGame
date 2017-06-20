using System;
using System.Net;
using System.Net.Sockets;

namespace MyWebeSocket
{
    public class WebSocketConnection
    {
        public Socket socket { get; set; }

        public byte[] buffer;

        public string NickName { get; set; }

        public EndPoint Id { get; set; }

        public IntPtr handle { get; set; }

        public string Name
        {
            get
            {
                if (!string.IsNullOrEmpty(NickName))
                {
                    return NickName;
                }
                else
                {
                    return string.Format("{0}#{1}", Id, handle);
                }
            }
        }

        public bool IsHandShaked { get; set; }
        public bool IsCreater { get; set; }
        public int roomId { get; set; }
        ~WebSocketConnection()
        {
            try
            {
                if (socket != null)
                    socket.Disconnect(false);
            }
            catch
            {

            }
        }
    }
}
