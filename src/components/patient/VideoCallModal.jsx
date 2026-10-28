import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Send, 
  X, 
  ShieldCheck, 
  Maximize2 
} from 'lucide-react';

export const VideoCallModal = () => {
  const { activeModal, setActiveModal, selectedAppointment } = useApp();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Shifokor', text: 'Assalomu aleykum! Qabulga xush kelibsiz. Sizni eshitaman.' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  if (activeModal !== 'video-call') return null;

  const doctorName = selectedAppointment ? selectedAppointment.doctorName : 'Dr. Akmal Rahimov';

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'Siz', text: inputMsg }]);
    setInputMsg('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { sender: 'Shifokor', text: 'Tushundim, belgilangan dori-darmonlar jadvaliga rioya qiling. Retseptingizni E-Karta bo\'limiga biriktirib qo\'ydim.' }
      ]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden text-white flex flex-col md:flex-row h-[550px] relative">
        
        {/* Main Video Stream Container */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          
          {/* Doctor Video Simulator Feed */}
          <div className="absolute inset-0 flex items-center justify-center">
            {videoOn ? (
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80" 
                alt="Doctor Stream" 
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <VideoOff className="w-10 h-10" />
                </div>
                <p className="text-xs text-slate-400">Video o'chirilgan</p>
              </div>
            )}
          </div>

          {/* Top Live Badge Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold">{doctorName} (Onlayn Konsultatsiya)</span>
            </div>

            <button 
              onClick={() => setActiveModal(null)}
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Patient Self Video Window (Picture-in-picture) */}
          <div className="absolute bottom-16 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-800 z-10">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" 
              alt="Self preview" 
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-2 text-[9px] bg-slate-900/80 px-1 rounded">Siz (Bemor)</span>
          </div>

          {/* Video Control Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-slate-700 flex items-center space-x-4 z-20">
            <button 
              onClick={() => setMicOn(!micOn)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
              }`}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setVideoOn(!videoOn)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                videoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
              }`}
            >
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setActiveModal(null)}
              className="w-12 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition font-bold"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Right Chat Sidebar */}
        <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Suhbat va Savollar</span>
            </h4>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Shifrlangan 256-bit
            </span>
          </div>

          {/* Messages Feed */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-2xl text-xs max-w-[85%] ${
                  msg.sender === 'Siz' 
                    ? 'bg-teal-600 text-white ml-auto rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <span className="text-[10px] font-bold opacity-75 block mb-0.5">{msg.sender}:</span>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input 
              type="text"
              placeholder="Xabar yozing..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button 
              type="submit"
              className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 flex items-center justify-center text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
