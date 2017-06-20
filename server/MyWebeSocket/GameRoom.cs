using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyWebeSocket
{
    class GameRoom
    {
        public int size { get; set; }
        public int roomId { get; set; }
        public WebSocketConnection creater { get; set; }
        public WebSocketConnection enemy { get; set; }

        public GameRoom(WebSocketConnection creater, int roomId, int size)
        {   
            this.creater = creater;
            this.roomId = roomId;
            this.size = size;
            enemy = null;
        }
        ~GameRoom()
        {
            try
            {
                Console.WriteLine("GameRoom end.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

    }
}
