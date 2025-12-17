
import React, { useState, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { generateSuggestion, chatWithAI, extractReferences } from './services/geminiService';
import { Suggestion, ChatMessage, Reference, ViewMode } from './types';

// --- Icons Component ---
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// --- Layout Components ---

const Sidebar = ({ viewMode }: { viewMode: ViewMode | 'SETTINGS' }) => {
  return (
    <aside className="w-20 lg:w-64 flex-shrink-0 flex flex-col border-r border-border-color dark:border-white/10 bg-background-light dark:bg-background-dark z-20 transition-all duration-300">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6">
        <div className="flex items-center gap-1 font-black text-primary text-2xl">
            <Icon name="chat_bubble" className="filled text-primary" />
            <span className="tracking-tighter hidden lg:block text-text-main dark:text-white">_ORK</span>
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2 p-3">
        <Link to="/" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${viewMode === ViewMode.EDITOR ? 'bg-primary/20 text-text-main dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-white/5 text-text-muted'}`}>
          <Icon name="edit_document" className={viewMode === ViewMode.EDITOR ? "filled" : ""} />
          <span className="hidden lg:block font-medium text-sm">Editör</span>
        </Link>
        <Link to="/references" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${viewMode === ViewMode.REFERENCES ? 'bg-primary/20 text-text-main dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-white/5 text-text-muted'}`}>
          <Icon name="library_books" className={viewMode === ViewMode.REFERENCES ? "filled" : ""} />
          <span className="hidden lg:block font-medium text-sm">Kaynakça</span>
        </Link>
        <Link to="/settings" className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${viewMode === 'SETTINGS' ? 'bg-primary/20 text-text-main dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-white/5 text-text-muted'}`}>
            <Icon name="settings" className={viewMode === 'SETTINGS' ? "filled" : ""} />
            <span className="hidden lg:block font-medium text-sm">Ayarlar</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-border-color dark:border-white/10">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-orange-300 border-2 border-white dark:border-gray-800 flex items-center justify-center font-bold text-xs text-text-main">JD</div>
          <div className="hidden lg:flex flex-col">
            <p className="text-sm font-bold text-text-main dark:text-white">Jane Doe</p>
            <p className="text-xs text-text-muted">Doktora Adayı</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const initialContent = `Kıyı bölgelerindeki kentleşmenin hızlı ivmesi, çevresel sürdürülebilirlik açısından çok yönlü bir zorluk teşkil etmektedir. Şehirler hassas ekosistemlere doğru genişledikçe, insani gelişme ile doğal koruma arasındaki hassas denge giderek daha güvencesiz hale gelmektedir.

Son çalışmalar (Smith & Doe, 2023), kısa vadeli ekonomik kazanımların önemli olmasına rağmen, uzun vadeli ekolojik borcun önemli politika müdahaleleri olmaksızın geri döndürülemez olabileceğini göstermiştir. Bu nedenle, Güneydoğu Asya takımadalarındaki (Chen et al., 2022) hızlı kentsel yayılma ile mercan resifi sistemlerinin bozulması arasındaki korelasyonun incelenmesi kritik bir öneme sahiptir.

Yapay zekanın çevresel izleme süreçlerine entegrasyonu, bu etkilerin hafifletilmesi için umut verici bir yol sunmaktadır. Uydu görüntüleri ve öngörücü modelleme kullanan araştırmacılar, artık mercan resiflerindeki stres belirteçlerini geri döndürülemez ağarma gerçekleşmeden önce tespit edebilmektedir. Bu proaktif yaklaşım, geleneksel reaktif koruma yöntemlerinden önemli bir ayrışmayı temsil etmektedir.`;

const EditorScreen = ({ content, setContent, title, setTitle, fontSize, persona }: { content: string, setContent: (c: string) => void, title: string, setTitle: (t: string) => void, fontSize: string, persona: string }) => {
    const [selectedText, setSelectedText] = useState("");
    const [currentRange, setCurrentRange] = useState<Range | null>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
    const [showAssistant, setShowAssistant] = useState(true);
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerText.trim() === "") {
            editorRef.current.innerText = content;
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleMouseUp = () => {
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
                return;
            }

            const isInEditor = editorRef.current?.contains(selection.anchorNode);
            const isInTitle = titleRef.current?.contains(selection.anchorNode);

            if (!isInEditor && !isInTitle) {
                return;
            }

            const text = selection.toString().trim();
            if (!text) {
                 return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const top = rect.top - 50; 
            const left = rect.left + (rect.width / 2);

            setToolbarPos({ top, left });
            setSelectedText(text);
            setCurrentRange(range.cloneRange());
            setShowToolbar(true);
        }, 10);
    };

    const handleInput = () => {
        if (editorRef.current) setContent(editorRef.current.innerText);
    };

    const handleTitleInput = () => {
        if (titleRef.current) setTitle(titleRef.current.innerText);
    };

    const execCmd = (cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        if (editorRef.current) {
            editorRef.current.focus();
            setContent(editorRef.current.innerText);
        }
    };

    const insertHeading = (t?: string) => {
        const hName = t || "Yeni Başlık";
        const html = `<h2 class="text-3xl font-black mt-12 mb-6 outline-none" style="font-family: 'Spline Sans', sans-serif;">2. ${hName}</h2><p><br></p>`;
        execCmd('insertHTML', html);
    };

    const addToChat = (role: 'user' | 'model', text: string, suggestion?: Suggestion) => {
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role,
            text,
            suggestion,
            timestamp: Date.now()
        }]);
    };

    const handleAITask = async (task: string, constraints: string) => {
        setShowToolbar(false);
        if (!showAssistant) setShowAssistant(true);
        const textToProcess = selectedText || editorRef.current?.innerText || "";
        const userActionText = selectedText 
            ? `${task}: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"` 
            : task;
        addToChat('user', userActionText);
        setIsThinking(true);
        try {
            const suggestion = await generateSuggestion(task, textToProcess, constraints, persona);
            if (suggestion) {
                addToChat('model', "Önerilen değişiklik aşağıdadır:", suggestion);
            } else {
                addToChat('model', "Üzgünüm, bu isteği yerine getiremedim.");
            }
        } catch (error) {
            addToChat('model', "Bir hata oluştu.");
        } finally {
            setIsThinking(false);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userInput = chatInput;
        setChatInput("");
        addToChat('user', userInput);
        setIsThinking(true);
        
        try {
             const lowerInput = userInput.toLowerCase();

             if (lowerInput.includes("başlık ekle") || lowerInput.includes("ikinci başlık")) {
                 setIsThinking(false);
                 const suggestedTitle = lowerInput.includes("taraması") ? "Literatür Taraması" : "Yöntem";
                 const htmlString = `2. ${suggestedTitle}`;
                 addToChat('model', "Metne uygun bir başlık önerisi hazırladım:", {
                    id: crypto.randomUUID(),
                    originalText: "",
                    suggestedText: htmlString,
                    type: 'rewrite'
                 });
                 return;
             }

             const editKeywords = ["çevir", "translate", "rewrite", "yaz", "yap", "düzenle", "akademik", "daha", "kısa", "uzun", "özet", "improve", "refine", "fix", "correct", "düzelt", "değiştir"];
             const isEditRequest = editKeywords.some(kw => lowerInput.includes(kw));

             if (isEditRequest) {
                 let targetText = "";
                 let constraints = "Respond ONLY with the rewritten text content.";
                 
                 if (lowerInput.includes("başlık") || lowerInput.includes("title")) {
                    targetText = titleRef.current?.innerText || "";
                    constraints += " Focus specifically on improving the title.";
                 } else if (selectedText) {
                    targetText = selectedText;
                 } else {
                    targetText = editorRef.current?.innerText || "";
                 }

                 const suggestion = await generateSuggestion(userInput, targetText, constraints, persona);
                 if (suggestion) {
                     addToChat('model', "İstediğiniz değişikliği hazırladım. Onaylamak için aşağıdaki butona basın:", suggestion);
                     return;
                 }
             }

             const context = `Başlık: ${title}\nİçerik: ${content}`;
             const response = await chatWithAI(userInput, context, persona);
             addToChat('model', response);
        } finally {
            setIsThinking(false);
        }
    };

    const applySuggestion = (suggestion: Suggestion, messageId: string) => {
        const isHeading = suggestion.suggestedText.startsWith("2.");
        
        if (isHeading) {
            insertHeading(suggestion.suggestedText.replace("2. ", ""));
        } else if (currentRange) {
            const selection = window.getSelection();
            if (selection) {
                try {
                    selection.removeAllRanges();
                    selection.addRange(currentRange);
                    document.execCommand('insertText', false, suggestion.suggestedText);
                    if (editorRef.current) {
                        setContent(editorRef.current.innerText);
                    }
                } catch (e) {
                    console.error("ExecCommand failed, falling back to replace:", e);
                    fallbackReplace(suggestion);
                }
            }
        } else {
            fallbackReplace(suggestion);
        }
        
        setMessages(prev => prev.map(msg => 
            msg.id === messageId 
            ? { ...msg, suggestion: { ...msg.suggestion!, accepted: true } }
            : msg
        ));
        
        setSelectedText("");
        setCurrentRange(null);
        setShowToolbar(false);
    };

    const fallbackReplace = (suggestion: Suggestion) => {
        const currentContent = editorRef.current?.innerText || "";
        const titleText = titleRef.current?.innerText || "";

        if (suggestion.originalText === titleText || (titleText.includes(suggestion.originalText) && suggestion.originalText !== "")) {
            setTitle(suggestion.suggestedText);
            if (titleRef.current) titleRef.current.innerText = suggestion.suggestedText;
            return;
        }

        if (editorRef.current) {
            let newText = "";
            if (suggestion.originalText && currentContent.includes(suggestion.originalText)) {
                newText = currentContent.replace(suggestion.originalText, suggestion.suggestedText);
            } else if (!suggestion.originalText || suggestion.originalText.length > currentContent.length * 0.8) {
                newText = suggestion.suggestedText;
            } else {
                newText = currentContent + "\n\n" + suggestion.suggestedText;
            }
            
            editorRef.current.innerText = newText;
            setContent(newText);
        }
    };

    const styleControls = [
        { label: "Daha Akademik", task: "Rewrite with a more academic tone", constraints: "Academic level: graduate. Tone: Formal." },
        { label: "Kısalt", task: "Make the text more concise", constraints: "Output length: shorter" },
        { label: "🇹🇷 Türkçeye Çevir", task: "Metni Türkçeye çevir", constraints: "Language: Turkish. Tone: Academic." },
        { label: "EN İngilizceye Çevir", task: "Metni İngilizceye çevir", constraints: "Language: English. Tone: Academic." },
        { label: "Basitleştir", task: "Simplify the language", constraints: "Clarity over complexity." },
    ];

    return (
        <div className="flex h-full overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar viewMode={ViewMode.EDITOR} />
            <main className="flex-1 flex flex-col h-full relative z-10">
                 <header className="h-16 px-8 flex items-center justify-between border-b border-border-color dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-2 text-sm font-bold opacity-60 uppercase">BELGELER / {title || 'AKADEMİK_METİN'}.DOCX</div>
                    <button onClick={() => setShowAssistant(!showAssistant)} className="xl:hidden"><Icon name="spark" /></button>
                </header>

                <div className="flex-1 overflow-y-auto bg-[#f2f2ee] dark:bg-[#12120a] p-4 md:p-8 flex justify-center relative">
                    {showToolbar && (
                        <div className="fixed z-50 flex items-center gap-1 p-1.5 bg-black text-white rounded-full shadow-2xl animate-fade-in -translate-x-1/2" style={{ top: toolbarPos.top, left: toolbarPos.left }} onMouseDown={(e) => e.preventDefault()}>
                             <button onClick={() => handleAITask("Shorten this text", "Output length: shorter")} className="px-3 py-1.5 hover:bg-white/20 rounded-full text-xs font-bold">Kısalt</button>
                             <button onClick={() => handleAITask("Make it more academic", "Tone: Academic")} className="px-3 py-1.5 bg-primary text-black hover:bg-primary-dark rounded-full text-xs font-bold">Akademik</button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-surface-dark w-full max-w-[850px] min-h-[1000px] shadow-sm rounded-lg p-12 md:p-20 relative">
                        <div className="absolute top-0 left-0 right-0 h-14 border-b border-border-color dark:border-white/10 flex items-center px-8 gap-1 bg-white dark:bg-surface-dark rounded-t-lg">
                             <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="w-8 h-8 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors">B</button>
                             <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="w-8 h-8 italic font-serif hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors">I</button>
                             <div className="w-px h-6 bg-border-color dark:bg-white/10 mx-2"></div>
                             <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors">
                                <Icon name="format_list_bulleted" className="text-[20px]" />
                             </button>
                             <button 
                                onMouseDown={(e) => { e.preventDefault(); insertHeading(); }} 
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-xs font-bold transition-all ml-2"
                             >
                                <Icon name="title" className="text-[18px]" />
                                BAŞLIK EKLE
                             </button>
                             <div className="w-px h-6 bg-border-color dark:bg-white/10 mx-2"></div>
                             <button 
                                onClick={() => handleAITask("Rewrite", "Focus on academic quality and clarity.")} 
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-text-main rounded-lg text-xs font-black transition-all"
                             >
                                <Icon name="auto_fix_high" className="text-[18px]" />
                                YENİDEN YAZ
                             </button>
                        </div>
                        <div className="mt-8">
                            <h1 ref={titleRef} className="text-4xl font-black mb-8 outline-none" contentEditable suppressContentEditableWarning onMouseUp={handleMouseUp} onInput={handleTitleInput}>1. Giriş</h1>
                            <div ref={editorRef} contentEditable suppressContentEditableWarning onMouseUp={handleMouseUp} onInput={handleInput} className="w-full outline-none leading-loose font-serif text-text-main dark:text-gray-200" style={{ minHeight: '800px', fontSize }} spellCheck={false} />
                        </div>
                    </div>
                </div>
            </main>

            <aside className={`w-[450px] flex-shrink-0 bg-white dark:bg-background-dark border-l border-border-color dark:border-white/10 flex flex-col z-[60] shadow-2xl fixed inset-y-0 right-0 h-full transition-transform duration-300 ease-in-out ${showAssistant ? 'translate-x-0' : 'translate-x-full'} xl:relative xl:translate-x-0`}>
                <div className="p-6 flex items-center justify-between border-b border-border-color dark:border-white/10">
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-black text-primary text-xl">
                            <Icon name="chat_bubble" className="filled text-primary" />
                            <span className="tracking-tighter">_ORK</span>
                        </div>
                        <h2 className="font-bold text-lg ml-2">Asistan</h2>
                     </div>
                     <button onClick={() => setShowAssistant(false)}><Icon name="close" className="text-text-muted" /></button>
                </div>

                {selectedText && (
                    <div className="px-5 py-3 bg-primary/10 border-b border-primary/20 flex gap-3 animate-fade-in">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-primary-dark uppercase mb-1">Seçili Metin</p>
                            <p className="text-sm text-text-main italic opacity-80 line-clamp-2">"{selectedText}"</p>
                        </div>
                        <button onClick={() => { setSelectedText(""); setCurrentRange(null); }}><Icon name="close" className="text-[18px]" /></button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 pb-32 pt-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-sm text-text-muted mb-4">Size nasıl yardımcı olabilirim?</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {styleControls.map((control) => (
                                    <button key={control.label} onClick={() => handleAITask(control.task, control.constraints)} className="px-4 py-2 bg-white dark:bg-white/5 border border-border-color dark:border-white/10 rounded-full text-xs font-bold hover:bg-primary transition-colors text-text-main dark:text-white">
                                        {control.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] uppercase font-black text-text-muted tracking-widest px-1">
                                {msg.role === 'user' ? 'SİZ' : 'SCHOLAR AI'}
                            </span>

                            <div className={`px-5 py-4 rounded-3xl max-w-[95%] text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-primary text-text-main font-bold rounded-tr-none' 
                                : 'bg-[#fafafa] dark:bg-white/5 border border-border-color dark:border-white/10 text-text-main dark:text-gray-200 rounded-tl-none'
                            }`}>
                                {msg.text}

                                {msg.suggestion && (
                                    <div className="mt-4 pt-4 border-t border-border-color dark:border-white/10 space-y-3">
                                        {!msg.suggestion.accepted && (
                                            <div className="bg-white dark:bg-black/20 p-4 rounded-xl border-2 border-primary/30 shadow-inner italic text-text-main dark:text-gray-100 mb-3 font-serif leading-loose">
                                                {msg.suggestion.suggestedText}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => applySuggestion(msg.suggestion!, msg.id)}
                                            disabled={msg.suggestion.accepted}
                                            className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                                                msg.suggestion.accepted 
                                                ? "bg-green-100 text-green-700 cursor-default"
                                                : "bg-primary text-text-main hover:scale-[1.03] active:scale-[0.97] hover:shadow-primary/20"
                                            }`}
                                        >
                                            <Icon name={msg.suggestion.accepted ? "check_circle" : "auto_fix_normal"} className="text-[20px]" />
                                            {msg.suggestion.accepted ? "METİN GÜNCELLENDİ" : (msg.suggestion.suggestedText.startsWith("2.") ? "BAŞLIK OLARAK EKLE" : "DEĞİŞTİR / APPLY")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex gap-1.5 p-4 bg-gray-50 dark:bg-white/5 rounded-3xl w-20">
                            <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-150"></span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-background-dark border-t border-border-color dark:border-white/10">
                    <form onSubmit={handleChatSubmit} className="relative group">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Değişiklik isteyin veya soru sorun..."
                            className="w-full pl-6 pr-14 py-4 bg-[#f4f4f2] dark:bg-white/5 border-none rounded-2xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/30 transition-all text-text-main dark:text-white"
                        />
                        <button 
                            type="submit"
                            disabled={!chatInput.trim() || isThinking}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-[#e5e5e0] dark:bg-white/10 disabled:opacity-50 text-text-main rounded-xl transition-all hover:bg-primary"
                        >
                            <Icon name="arrow_upward" className="text-[20px]" />
                        </button>
                    </form>
                </div>
            </aside>
        </div>
    );
};

const ReferencesScreen = ({ content, references, setReferences, citationStyle }: { content: string, references: Reference[], setReferences: (refs: Reference[]) => void, citationStyle: string }) => {
    const [isScanning, setIsScanning] = useState(false);

    const handleSync = async () => {
        setIsScanning(true);
        try {
            const extracted = await extractReferences(content, citationStyle);
            setReferences(extracted);
        } catch (error) {
            console.error(error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-background-light dark:bg-background-dark">
             <Sidebar viewMode={ViewMode.REFERENCES} />
             <main className="flex-1 flex flex-col h-full">
                <header className="h-16 px-8 flex items-center justify-between bg-surface-light dark:bg-background-dark border-b border-border-color dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-lg text-text-main dark:text-white">Kaynakça</h1>
                        <span className="px-2 py-0.5 bg-primary/20 text-text-main dark:text-primary text-[10px] font-black rounded uppercase tracking-wider">{citationStyle} Stili</span>
                    </div>
                    <button 
                        onClick={handleSync}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-text-main rounded-xl text-xs font-black transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <Icon name={isScanning ? "sync" : "auto_fix_high"} className={isScanning ? "animate-spin" : ""} />
                        {isScanning ? "METİN TARANIYOR..." : "YENİDEN ANALİZ ET VE LİSTELE"}
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-8 bg-[#f2f2ee] dark:bg-[#12120a]">
                    <div className="max-w-4xl mx-auto bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-color dark:border-white/10 p-12">
                         <h2 className="text-3xl font-black mb-10 border-b border-border-color pb-4">Bibliyografya</h2>
                         
                         {references.length === 0 ? (
                             <div className="py-20 text-center flex flex-col items-center gap-4 animate-fade-in">
                                 <Icon name="library_books" className="text-6xl text-text-muted opacity-20" />
                                 <p className="text-text-muted font-medium">Henüz bir kaynakça oluşturulmadı. <br/>Metninizdeki atıfları {citationStyle} formatında listelemek için yukarıdaki butona tıklayın.</p>
                             </div>
                         ) : (
                             <div className="space-y-8 animate-fade-in">
                                 {references.map((ref) => {
                                     // Filter out invalid placeholder text if it somehow slipped through
                                     const hasAuthors = ref.authors && !ref.authors.includes("[Bilgi");
                                     const hasTitle = ref.title && !ref.title.includes("[Bilgi");

                                     return (
                                     <div key={ref.id} className="group relative">
                                         <p className="text-lg leading-relaxed text-text-main dark:text-gray-200">
                                             <span className="font-bold">{hasAuthors ? ref.authors : "Anonim"}</span> {ref.year ? `(${ref.year})` : ""}. 
                                             {hasTitle && <span className="italic ml-1">"{ref.title}"</span>}.
                                         </p>
                                         <div className="mt-2 flex items-center gap-4">
                                            {ref.source && !ref.source.includes("[Bilgi") && (
                                                <div className="flex items-center gap-1.5 text-primary-dark font-medium text-sm">
                                                    <Icon name="source" className="text-sm" />
                                                    <span>{ref.source}</span>
                                                </div>
                                            )}
                                            {ref.doi && !ref.doi.includes("[Bilgi") && (
                                                <div className="flex items-center gap-1.5 text-text-muted text-xs font-mono opacity-60">
                                                    <Icon name="link" className="text-xs" />
                                                    <span>DOI: {ref.doi}</span>
                                                </div>
                                            )}
                                         </div>
                                         <div className="h-px w-full bg-border-color dark:bg-white/5 mt-8 group-last:hidden"></div>
                                     </div>
                                 )})}
                             </div>
                         )}
                    </div>
                </div>
             </main>
        </div>
    );
};

const SettingsScreen = ({ fontSize, setFontSize, citationStyle, setCitationStyle, aiPersona, setAiPersona }: { fontSize: string, setFontSize: (s: string) => void, citationStyle: string, setCitationStyle: (s: string) => void, aiPersona: string, setAiPersona: (p: string) => void }) => {
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        setIsDarkMode(isDark);
    };

    return (
        <div className="flex h-full overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar viewMode="SETTINGS" />
            <main className="flex-1 flex flex-col h-full">
                <header className="h-16 px-8 flex items-center justify-between bg-surface-light dark:bg-background-dark border-b border-border-color dark:border-white/10 shrink-0">
                    <h1 className="font-bold text-lg text-text-main dark:text-white">Ayarlar</h1>
                </header>
                <div className="flex-1 overflow-y-auto p-8 bg-[#f2f2ee] dark:bg-[#12120a]">
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* Appearance Section */}
                        <section className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-border-color dark:border-white/10">
                                <h2 className="font-black text-xl flex items-center gap-2">
                                    <Icon name="palette" className="text-primary-dark" />
                                    Görünüm
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">Koyu Tema</p>
                                        <p className="text-sm text-text-muted">Arayüz renklerini gece moduna ayarlar.</p>
                                    </div>
                                    <button 
                                        onClick={toggleTheme}
                                        className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${isDarkMode ? 'bg-primary' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                                            <Icon name={isDarkMode ? 'dark_mode' : 'light_mode'} className="text-[14px] text-text-main" />
                                        </div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">Yazı Boyutu</p>
                                        <p className="text-sm text-text-muted">Editördeki metin büyüklüğünü belirler.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setFontSize('14px')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${fontSize === '14px' ? 'bg-primary text-text-main shadow-lg' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200'}`}>Küçük</button>
                                        <button onClick={() => setFontSize('18px')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${fontSize === '18px' ? 'bg-primary text-text-main shadow-lg' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200'}`}>Normal</button>
                                        <button onClick={() => setFontSize('22px')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${fontSize === '22px' ? 'bg-primary text-text-main shadow-lg' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200'}`}>Büyük</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Academic Config Section */}
                        <section className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-border-color dark:border-white/10">
                                <h2 className="font-black text-xl flex items-center gap-2">
                                    <Icon name="school" className="text-primary-dark" />
                                    Akademik Yapılandırma
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <p className="font-bold mb-3">Atıf Stili</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['APA', 'MLA', 'IEEE', 'Harvard'].map(style => (
                                            <button 
                                                key={style}
                                                onClick={() => setCitationStyle(style)}
                                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${citationStyle === style ? 'border-primary bg-primary/10 text-text-main' : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100'}`}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="font-bold mb-3">Asistan Kişiliği</p>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'Strict Academic', label: 'Katı Akademik', desc: 'Resmiyet ve yapıya odaklanır.' },
                                            { id: 'Friendly Peer', label: 'Akademik Hakem', desc: 'Daha yapıcı ve akıcı öneriler sunar.' },
                                            { id: 'Minimalist Editor', label: 'Minimalist Editör', desc: 'Sadece gerekli düzeltmeleri yapar.' }
                                        ].map(p => (
                                            <button 
                                                key={p.id}
                                                onClick={() => setAiPersona(p.id)}
                                                className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between ${aiPersona === p.id ? 'border-primary bg-primary/10' : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100'}`}
                                            >
                                                <div>
                                                    <p className="font-bold text-sm">{p.label}</p>
                                                    <p className="text-xs text-text-muted">{p.desc}</p>
                                                </div>
                                                {aiPersona === p.id && <Icon name="check_circle" className="text-primary-dark" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="text-center py-4">
                            <p className="text-xs text-text-muted">ScholarAI v1.2.0 - Developed with Gemini API</p>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

const App = () => {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState("Giriş");
  const [references, setReferences] = useState<Reference[]>([]);
  const [fontSize, setFontSize] = useState('18px');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [aiPersona, setAiPersona] = useState('Strict Academic');

  return (
    <Router>
        <Routes>
            <Route path="/" element={<EditorScreen content={content} setContent={setContent} title={title} setTitle={setTitle} fontSize={fontSize} persona={aiPersona} />} />
            <Route path="/references" element={<ReferencesScreen content={content} references={references} setReferences={setReferences} citationStyle={citationStyle} />} />
            <Route path="/settings" element={<SettingsScreen fontSize={fontSize} setFontSize={setFontSize} citationStyle={citationStyle} setCitationStyle={setCitationStyle} aiPersona={aiPersona} setAiPersona={setAiPersona} />} />
        </Routes>
    </Router>
  );
};

export default App;
