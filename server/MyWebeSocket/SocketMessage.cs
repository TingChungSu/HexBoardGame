using System;

namespace MyWebeSocket
{
    public class SocketMessage
    {
        public bool isLoginMessage { get; set; }
        public WebSocketConnection Client { get; set; }
        public string Message { get; set; }
        public DateTime Time { get; set; }
    }
}