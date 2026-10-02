'use client';

import { useState } from 'react';
import { Mic, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import { voiceInventoryAssistant } from '@/ai/flows/voice-inventory-assistant';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function VoiceAssistantUI() {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typedCommand, setTypedCommand] = useState('');

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setIsLoading(true);
    setResponse(null);
    
    try {
      const result = await voiceInventoryAssistant({ command: cmd });
      setResponse(result.response);
      setTypedCommand('');
    } catch (error) {
      setResponse("I'm sorry, I couldn't understand that. Please try again.");
    } finally {
      setIsLoading(false);
      setIsListening(false);
    }
  };

  const startListening = () => {
    setIsListening(true);
    setResponse(null);
    // In a real app, this would trigger actual Speech-to-Text
    // For the preview, we'll allow typing as a fallback/test
  };

  return (
    <Dialog onOpenChange={(open) => { if(!open) { setResponse(null); setTypedCommand(''); setIsListening(false); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-medium border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
          <Mic className="w-6 h-6" />
          {t('voiceAssistant')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-none shadow-2xl rounded-t-[2.5rem] top-auto bottom-0 translate-y-0 duration-300">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center pt-4">{t('voiceAssistant')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 gap-6">
          <div 
            onClick={startListening}
            className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer relative transition-all duration-500 ${isListening ? 'bg-primary scale-110 shadow-xl shadow-primary/20' : 'bg-primary/10 hover:bg-primary/20'}`}
          >
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25" />
            )}
            <Mic className={`w-14 h-14 ${isListening ? 'text-white' : 'text-primary'}`} />
          </div>
          
          <div className="text-center px-6 w-full">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Processing your request...</p>
              </div>
            ) : response ? (
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 animate-in fade-in zoom-in-95">
                <p className="text-xl font-medium text-foreground leading-relaxed">{response}</p>
                <Button variant="ghost" className="mt-4 text-primary font-bold" onClick={() => setResponse(null)}>
                  Try another command
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xl font-bold">{isListening ? 'Listening...' : t('voiceHint')}</p>
                  <p className="text-muted-foreground text-sm italic">"I bought 2 liters of milk and some eggs"</p>
                </div>

                {!isListening && (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Or type here..." 
                      value={typedCommand}
                      onChange={(e) => setTypedCommand(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCommand(typedCommand)}
                      className="h-14 rounded-xl border-muted bg-muted/20"
                    />
                    <Button 
                      size="icon" 
                      className="h-14 w-14 rounded-xl shrink-0"
                      onClick={() => handleCommand(typedCommand)}
                      disabled={!typedCommand}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button 
            onClick={() => isListening ? handleCommand("add 2 milk") : startListening()} 
            disabled={isLoading}
            variant={isListening ? "destructive" : "default"}
            className="w-full h-16 text-xl rounded-2xl font-bold transition-all"
          >
            {isListening ? 'Stop & Send' : 'Tap to Speak'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
