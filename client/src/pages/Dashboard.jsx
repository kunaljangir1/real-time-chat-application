import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatWindow from '../components/ChatWindow';
import { API_URL } from '../config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [socket, setSocket] = useState(null);
    
    const [activeRoom, setActiveRoom] = useState('Global Lounge'); 
    const [conversations, setConversations] = useState([]);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [usersForModal, setUsersForModal] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUserInfo(parsedUser);

        const newSocket = io(API_URL, { query: { userId: parsedUser.id } });
        setSocket(newSocket);

        newSocket.on('user_status_changed', (data) => {
            setConversations(prev => prev.map(c => 
                c.targetUserId === data.userId ? { ...c, onlineStatus: data.status === 'online' } : c
            ));
        });

        // When a message is received globally, if it's not the active room, bump unread + change preview
        newSocket.on('receive_message', (data) => {
             setConversations(prev => {
                  let updated = [...prev];
                  const idx = updated.findIndex(c => c.id === data.roomId);
                  if (idx > -1) {
                      const c = updated[idx];
                      updated[idx] = { 
                          ...c, 
                          lastMessage: data.content,
                          // only bump unread if we aren't looking at this room!
                          unreadCount: c.id !== activeRoom ? c.unreadCount + 1 : c.unreadCount
                      };
                      // Bubble to top
                      const item = updated.splice(idx, 1)[0];
                      updated.unshift(item);
                  }
                  return updated;
             });
        });

        fetchConversations(parsedUser.id);
        fetchUsersForModal();

        return () => newSocket.disconnect();
    }, [navigate, activeRoom]); // Active room as dependency to ensure receive_message accurately evaluates if window is open

    const fetchConversations = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/api/conversations?userId=${userId}`);
            const data = await res.json();
            setConversations(data);
        } catch (err) { console.error(err); }
    };

    const fetchUsersForModal = async () => {
         try {
            const res = await fetch(`${API_URL}/api/users`);
            const data = await res.json();
            setUsersForModal(data);
        } catch (err) { console.error(err); }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        
        // Native 1-on-1 Conversation Router
        if ((!newRoomName || newRoomName.trim() === '') && selectedUsers.length === 1) {
             const targetUserId = selectedUsers[0];
             const p1 = userInfo.id;
             const p2 = targetUserId;
             const oneOnOneRoomName = p1 < p2 ? `${p1}_${p2}` : `${p2}_${p1}`;
             
             setShowModal(false);
             setSelectedUsers([]);
             setActiveRoom(oneOnOneRoomName);
             return;
        }

        if (!newRoomName || newRoomName.trim() === '') {
             alert('Provide a group name or select exactly ONE user to start a direct message.');
             return;
        }
        
        try {
            const res = await fetch(`${API_URL}/api/rooms/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName: newRoomName.trim(), members: [...selectedUsers, userInfo.id] })
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                setNewRoomName('');
                setSelectedUsers([]);
                await fetchConversations(userInfo.id);
                setActiveRoom(data.roomName);
            } else { alert(data.message || 'Error creating room'); }
        } catch(err) { console.error(err); }
    };

    if (!userInfo || !socket) {
        return <div className="flex items-center justify-center h-screen text-slate-400">Connecting to Secure Servers...</div>;
    }

    return (
        <div className="flex h-screen bg-brand-dark overflow-hidden">
            
            {/* Sidebar List */}
            <div className="w-[320px] shrink-0 border-r border-slate-800 flex flex-col bg-brand-dark">
                {/* Header Navbar */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">NeoChat</h2>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                             {userInfo.username}
                        </div>
                    </div>
                    <button onClick={() => setShowModal(true)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </button>
                </div>

                {/* Conversation Scroll */}
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                    <h4 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Conversations</h4>
                    
                    {conversations.map(conv => {
                        const isActive = activeRoom === conv.id;
                        return (
                            <div 
                                key={conv.id} onClick={() => { setActiveRoom(conv.id); setConversations(prev => prev.map(c => c.id === conv.id ? {...c, unreadCount: 0} : c)) }}
                                className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all ${isActive ? 'bg-indigo-500/10 shadow-[inset_3px_0_0_0_#8b5cf6]' : 'hover:bg-slate-800/50'}`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {conv.isGroup ? '#' : conv.name.charAt(0).toUpperCase()}
                                    </div>
                                    {!conv.isGroup && (
                                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-brand-dark ${conv.onlineStatus ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between mb-0.5">
                                        <h3 className={`font-semibold truncate text-sm ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>{conv.name}</h3>
                                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                                           {new Date(conv.lastMessageTime).getHours() > 0 ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-400 truncate pr-2">{conv.lastMessage}</p>
                                        {conv.unreadCount > 0 && (
                                            <span className="shrink-0 bg-indigo-500 text-white min-w-[20px] h-5 px-1 py-0.5 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-slate-800">
                     <button onClick={() => { localStorage.removeItem('userInfo'); socket.disconnect(); navigate('/login'); }} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-red-500/20">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                         Sign Out
                     </button>
                </div>
            </div>

            {/* Chat Canvas */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 relative">
                <ChatWindow socket={socket} currentUser={userInfo} roomId={activeRoom} />
            </div>

            {/* Modal Override */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm px-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-white">Start Conversation</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Group Name <span className="text-slate-500 text-xs font-normal">(Leave blank for 1-1 Chat)</span></label>
                                <input autoFocus type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. Engineering Team" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"/>
                            </div>
                            <div className="mb-6 h-48 overflow-y-auto pr-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Select Teammates</label>
                                <div className="space-y-2">
                                     {usersForModal.filter(u => u.id !== userInfo.id).map(u => (
                                         <label key={u.id} className="flex items-center p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                                            <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])} className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 offset-slate-900 border" />
                                            <div className="ml-3 flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-200">{u.username}</span>
                                                {u.onlineStatus && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                            </div>
                                         </label>
                                     ))}
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)] transition-all">Create Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
