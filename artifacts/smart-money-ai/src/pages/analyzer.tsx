import { useState, useRef } from "react";
import { useCreateAnalysis, useUploadImage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, CheckCircle2, AlertCircle, Activity, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Analysis } from "@workspace/api-client-react";

const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD", "Custom"];
const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

export default function Analyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pair, setPair] = useState(PAIRS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[4]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const uploadMutation = useUploadImage();
  const createAnalysisMutation = useCreateAnalysis();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
      setResult(null); // Reset result on new image
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!preview) return;
    
    setIsUploading(true);
    try {
      // preview is a data URL: "data:image/jpeg;base64,/9j/4AAQ..."
      // The backend upload endpoint expects just the base64 part or the full string?
      // Assuming it expects full data URL or base64. The API schema says "imageBase64". Let's send the base64 part.
      const base64Data = preview.split(',')[1];
      
      const uploadRes = await uploadMutation.mutateAsync({
        data: { imageBase64: base64Data }
      });
      
      const analysisRes = await createAnalysisMutation.mutateAsync({
        data: {
          imageBase64: uploadRes.imageBase64,
          pair,
          timeframe
        }
      });
      
      setResult(analysisRes);
      toast({ title: "Analysis complete", description: "Your chart has been analyzed successfully." });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Analyzer</h1>
        <p className="text-muted-foreground">Upload your chart for institutional-grade structural analysis</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Asset Pair</label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timeframe</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${preview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                {preview ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
                    <p className="text-sm font-medium">Image selected</p>
                    <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Drop chart image here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full font-bold" 
                disabled={!preview || isUploading || createAnalysisMutation.isPending}
                onClick={analyze}
              >
                {isUploading || createAnalysisMutation.isPending ? (
                  <><Activity className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  "Run Analysis"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8 space-y-6">
          <Card className="bg-card h-full min-h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                  <p>Upload a chart and run analysis to see results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary row */}
                  <div className="flex flex-wrap gap-4">
                    <div className={`px-4 py-2 rounded-lg font-bold border ${
                      result.result.marketBias === 'Bullish' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      result.result.marketBias === 'Bearish' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      BIAS: {result.result.marketBias.toUpperCase()}
                    </div>
                    
                    <div className="px-4 py-2 rounded-lg font-bold border border-primary/20 bg-primary/10 text-primary">
                      CONFIDENCE: {result.result.confidenceScore}/100
                    </div>
                  </div>

                  {/* Grid of details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Market Structure</span>
                      <p className="font-medium text-sm">{result.result.marketStructure}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Liquidity</span>
                      <p className="font-medium text-sm">{result.result.liquidity}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Order Block</span>
                      <p className="font-medium text-sm">{result.result.orderBlock}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">FVG</span>
                      <p className="font-medium text-sm">{result.result.fvg}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Premium/Discount</span>
                      <p className="font-medium text-sm">{result.result.premiumDiscount}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-bold mb-3 text-primary">Trade Setup</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="p-3 bg-background rounded-md border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Entry</span>
                        <span className="font-mono text-foreground font-medium">{result.result.entryPrice}</span>
                      </div>
                      <div className="p-3 bg-background rounded-md border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Stop Loss</span>
                        <span className="font-mono text-red-500 font-medium">{result.result.stopLoss}</span>
                      </div>
                      <div className="p-3 bg-background rounded-md border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Take Profit 1</span>
                        <span className="font-mono text-green-500 font-medium">{result.result.tp1}</span>
                      </div>
                      <div className="p-3 bg-background rounded-md border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Risk/Reward</span>
                        <span className="font-mono text-primary font-medium">1:{result.result.riskReward}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart Image */}
                  <div className="relative border border-border rounded-lg overflow-hidden bg-background aspect-video">
                    {/* Render the original image + overlays ideally. For now display original image. */}
                    <img src={preview || ""} alt="Analyzed Chart" className="w-full h-full object-contain" />
                    {/* Mock overlays would be generated from result.result.annotations */}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
