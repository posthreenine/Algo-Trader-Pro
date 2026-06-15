import { useState } from "react";
import { useListJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, getListJournalEntriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Journal() {
  const { data: entries, isLoading } = useListJournalEntries({});
  const createMutation = useCreateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    pair: "EURUSD",
    timeframe: "H1",
    bias: "Bullish",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    result: "Pending",
    notes: "",
    tradeDate: new Date().toISOString().split('T')[0]
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
      toast({ title: "Entry deleted" });
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          ...formData,
          entryPrice: Number(formData.entryPrice),
          stopLoss: Number(formData.stopLoss),
          takeProfit: Number(formData.takeProfit),
          tradeDate: new Date(formData.tradeDate).toISOString(),
        }
      });
      queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
      setOpen(false);
      toast({ title: "Trade logged successfully" });
    } catch (err) {
      toast({ title: "Failed to save trade", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Trading Journal</h1>
          <p className="text-muted-foreground">Record and review your market executions</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold"><Plus className="h-4 w-4" /> Log Trade</Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-foreground border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Trade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pair</label>
                  <Input value={formData.pair} onChange={e => setFormData({...formData, pair: e.target.value})} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={formData.tradeDate} onChange={e => setFormData({...formData, tradeDate: e.target.value})} required className="bg-background" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bias</label>
                  <Select value={formData.bias} onValueChange={v => setFormData({...formData, bias: v})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bullish">Bullish</SelectItem>
                      <SelectItem value="Bearish">Bearish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Result</label>
                  <Select value={formData.result} onValueChange={v => setFormData({...formData, result: v})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Win">Win</SelectItem>
                      <SelectItem value="Loss">Loss</SelectItem>
                      <SelectItem value="Break Even">Break Even</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Entry Price</label>
                  <Input type="number" step="any" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: e.target.value})} required className="bg-background font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stop Loss</label>
                  <Input type="number" step="any" value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: e.target.value})} required className="bg-background font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Take Profit</label>
                  <Input type="number" step="any" value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: e.target.value})} required className="bg-background font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeframe</label>
                  <Input value={formData.timeframe} onChange={e => setFormData({...formData, timeframe: e.target.value})} required className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-background" placeholder="Confluence, mistakes, lessons..." />
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createMutation.isPending} className="font-bold">Save Entry</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Pair</TableHead>
                <TableHead className="text-muted-foreground">Bias</TableHead>
                <TableHead className="text-muted-foreground font-mono">Entry</TableHead>
                <TableHead className="text-muted-foreground font-mono">SL</TableHead>
                <TableHead className="text-muted-foreground font-mono">TP</TableHead>
                <TableHead className="text-muted-foreground">Result</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading entries...</TableCell>
                </TableRow>
              ) : entries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No trades logged yet.</TableCell>
                </TableRow>
              ) : (
                entries?.map((entry) => (
                  <TableRow key={entry.id} className="border-border hover:bg-secondary/20">
                    <TableCell className="font-medium text-sm">{new Date(entry.tradeDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold">{entry.pair} <span className="text-xs font-normal text-muted-foreground ml-1">{entry.timeframe}</span></TableCell>
                    <TableCell>
                      <span className={entry.bias === 'Bullish' ? 'text-green-500' : 'text-red-500'}>{entry.bias}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.entryPrice}</TableCell>
                    <TableCell className="font-mono text-sm text-red-500/80">{entry.stopLoss}</TableCell>
                    <TableCell className="font-mono text-sm text-green-500/80">{entry.takeProfit}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        entry.result === 'Win' ? 'bg-green-500/20 text-green-500' : 
                        entry.result === 'Loss' ? 'bg-red-500/20 text-red-500' : 
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {entry.result || 'Pending'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
