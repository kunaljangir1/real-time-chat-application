import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';

const ChatWindow = ({ socket, currentUser, roomId }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket || !roomId) return;

        const fetchHistory = async () => {
             try {
                const response = await fetch(`${API_URL}/api/messages/${roomId}`);
                const historyData = await response.json();
                setMessages(historyData);
                socket.emit('messages_read', { roomId, readerId: currentUser.id });
             } catch (err) { console.error("Failed to load chat history", err); }
        };
        fetchHistory();

        socket.emit('join_room', roomId);

        const messageHandler = (data) => {
             setMessages(prev => [...prev, data]);
             if (data.senderId !== currentUser.id) {
                 socket.emit('messages_read', { roomId, readerId: currentUser.id });
             }
        };

        const readStatusHandler = (data) => {
             if (data.roomId === roomId && data.readerId !== currentUser.id) {
                 setMessages(prev => prev.map(m => m.senderId === currentUser.id ? { ...m, isRead: true } : m));
             }
        };

        socket.on('receive_message', messageHandler);
        socket.on('read_status_updated', readStatusHandler);

        return () => {
             socket.off('receive_message', messageHandler);
             socket.off('read_status_updated', readStatusHandler);
        };
    }, [socket, roomId, currentUser.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
         e.preventDefault();
         if (currentMessage.trim() === '') return;
         
         socket.emit('send_message', {
             roomId,
             senderId: currentUser.id,
             senderName: currentUser.username,
             content: currentMessage,
             timestamp: new Date().toISOString()
         });
         setCurrentMessage('');
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this conversation for the server? This cannot be undone.")) return;
        try {
            const res = await fetch(`${API_URL}/api/rooms/${roomId}`, { method: 'DELETE' });
            if (res.ok) {
                window.location.reload(); 
            } else {
                alert("Cannot delete this system room.");
            }
        } catch(err) { console.error("Error deleting room", err); }
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-[#1e293b] sticky top-0 z-10">
                 <div className="flex items-center">
                     <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-slate-300 mr-4">
                         {roomId.replace('room_', '').charAt(0).toUpperCase()}
                     </div>
                     <div>
                         <h3 className="font-bold text-slate-100 text-lg tracking-tight">{roomId.replace('room_', '')}</h3>
                         <p className="text-xs text-slate-400 font-medium">Secured • Real-Time Chat</p>
                     </div>
                 </div>
                 
                 {roomId !== 'Global Lounge' && (
                     <button onClick={handleDeleteRoom} className="p-2 text-slate-500 hover:text-red-400 hover:bg-[#0f172a] rounded-lg transition-colors" title="Delete Conversation">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                 )}
            </div>

            {/* Canvas */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {messages.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                         <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                             <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                         </div>
                         <p>Silence is golden. Break it!</p>
                     </div>
                )}
                {messages.map((msg, idx) => {
                     const isOwn = msg.senderId === currentUser.id;
                     return (
                         <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                             <div className={`max-w-[70%] lg:max-w-[60%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                                  {!isOwn && <span className="text-xs font-semibold text-indigo-400 pl-1 drop-shadow-sm">{msg.senderName}</span>}
                                  
                                  <div className={`px-4 py-2.5 rounded-2xl relative shadow-sm ${
                                      isOwn 
                                      ? 'bg-[#4f46e5] text-white rounded-br-sm' 
                                      : 'bg-[#1e293b] text-slate-100 rounded-bl-sm border border-slate-700'
                                  }`}>
                                      <p className="text-sm md:text-[15px] leading-relaxed break-words">{msg.content}</p>
                                  </div>
                                  
                                  <div className={`flex items-center gap-1.5 px-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                      <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {isOwn && (
                                          <span className={`text-[10px] font-bold ${msg.isRead ? 'text-emerald-400' : 'text-slate-500'}`}>
                                               {msg.isRead ? '✓✓' : '✓'}
                                          </span>
                                      )}
                                  </div>
                             </div>
                         </div>
                     )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 md:p-6 bg-[#0f172a] border-t border-slate-800 mt-auto">
                 <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
                     <input 
                         type="text" 
                         value={currentMessage}
                         onChange={e => setCurrentMessage(e.target.value)}
                         placeholder="Type a message..."
                         className="flex-1 bg-[#1e293b] border border-slate-700 rounded-full pl-6 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                     />
                     <button 
                         type="submit"
                         disabled={!currentMessage.trim()}
                         className="absolute right-2 top-1 bottom-1 aspect-square bg-[#4f46e5] hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                     >
                        <svg className="w-5 h-5 -ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                     </button>
                 </form>
            </div>
        </div>
    );
};

export default ChatWindow;
