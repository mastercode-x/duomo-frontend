// Centro de Mensajes del Campus Duomo LMS

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  MessageSquare, 
  Phone, 
  Video, 
  Info,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';

export function Messages() {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      setIsMobileListVisible(false);
    }
  }, [selectedConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await moodleApi.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConv) {
        // setSelectedConv(data[0]); // Opcional: auto-seleccionar primera
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: number) => {
    try {
      const data = await moodleApi.getMessages(convId);
      setMessages(data);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const text = newMessage;
    setNewMessage('');

    // Optimistic update
    const tempMsg = {
      id: Date.now(),
      text: text,
      useridfrom: currentUser?.id,
      timecreated: Math.floor(Date.now() / 1000)
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await moodleApi.sendMessage(selectedConv.id, text);
      loadMessages(selectedConv.id); // Recargar para confirmar
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading && conversations.length === 0) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4 overflow-hidden">
      {/* Sidebar - Lista de conversaciones */}
      <Card className={`w-full lg:w-80 flex flex-col ${!isMobileListVisible ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar mensajes..." className="pl-10 bg-gray-50 border-none" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No hay conversaciones
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUser = conv.members.find((m: any) => m.id !== currentUser?.id) || conv.members[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedConv?.id === conv.id ? 'bg-[#8B9A7D]/10 text-[#8B9A7D]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser.profileimageurl} />
                      <AvatarFallback className="bg-gray-200 text-xs">{getInitials(otherUser.fullname)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-sm truncate text-gray-900">{otherUser.fullname}</p>
                        {conv.unreadcount > 0 && (
                          <Badge className="bg-[#8B9A7D] hover:bg-[#8B9A7D] h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
                            {conv.unreadcount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.messages[0]?.text || 'Inicia una conversación'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className={`flex-1 flex flex-col ${isMobileListVisible ? 'hidden lg:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden" 
                  onClick={() => setIsMobileListVisible(true)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv.members.find((m: any) => m.id !== currentUser?.id)?.profileimageurl} />
                  <AvatarFallback>{getInitials(selectedConv.members.find((m: any) => m.id !== currentUser?.id)?.fullname)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedConv.members.find((m: any) => m.id !== currentUser?.id)?.fullname}
                  </p>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    En línea
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-gray-400"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-gray-400"><Video className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-gray-400"><Info className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
            >
              {messages.map((msg) => {
                const isMine = msg.useridfrom === currentUser?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      isMine 
                        ? 'bg-[#8B9A7D] text-white rounded-tr-none' 
                        : 'bg-white text-gray-900 border rounded-tl-none shadow-sm'
                    }`}>
                      <p dangerouslySetInnerHTML={{ __html: msg.text }} />
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(msg.timecreated * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Escribe un mensaje..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-50 border-none focus-visible:ring-[#8B9A7D]"
                />
                <Button type="submit" className="bg-[#8B9A7D] hover:bg-[#7A896C]">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Selecciona una conversación</h3>
            <p className="max-w-xs mt-2">
              Elige un contacto de la lista para comenzar a chatear o busca a alguien nuevo.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4 overflow-hidden">
      <Card className="w-80 hidden lg:flex flex-col">
        <div className="p-4 border-b"><Skeleton className="h-10 w-full" /></div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-3 w-32" /></div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-16" /></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-xl" /></div>
          <div className="flex justify-end"><Skeleton className="h-12 w-48 rounded-xl" /></div>
          <div className="flex justify-start"><Skeleton className="h-20 w-72 rounded-xl" /></div>
        </div>
        <div className="p-4 border-t"><Skeleton className="h-10 w-full" /></div>
      </Card>
    </div>
  );
}

export default Messages;
