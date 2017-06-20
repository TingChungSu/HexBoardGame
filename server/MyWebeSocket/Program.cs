using System;
using System.Net.Sockets;
using System.Net;
using System.Security.Cryptography;
using System.Threading;
using System.Collections.Generic;

namespace MyWebeSocket
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                WebSocketServer server = new WebSocketServer();
                server.Run(8080);
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
