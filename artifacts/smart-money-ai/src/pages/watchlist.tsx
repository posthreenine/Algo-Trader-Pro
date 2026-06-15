import { useState } from "react";
import { useListWatchlist, useAddToWatchlist, useRemoveFromWatchlist, getListWatchlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Watchlist() {
  const { data: watchlist, isLoading } = useListWatchlist({});
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ pair: "", notes: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pair.trim()) return;

    try {
      await addMutation.mutateAsync({
        data: {
          pair: formData.pair.toUpperCase(),
          notes: formData.notes
        }
      });
      queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
      setOpen(false);
      setFormData({ pair: "", notes: "" });
      toast({ title: "Added to watchlist" });
    } catch (err) {
      toast({ title: "Failed to add", variant: "destructive" });
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
      toast({ title: "Removed from watchlist" });
    } catch (err) {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Watchlist</h1>
          <p className="text-muted-foreground">Monitor high-probability setups</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold"><Plus className="h-4 w-4" /> Add Pair</Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-foreground border-border">
            <DialogHeader>
              <DialogTitle>Add to Watchlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Pair</label>
                <Input value={formData.pair} onChange={e => setFormData({...formData, pair: e.target.value})} placeholder="e.g. EURUSD" required className="bg-background uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Waiting for mitigation of H4 OB..." className="bg-background" />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={addMutation.isPending} className="font-bold">Add to Watchlist</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : watchlist?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg bg-card/50">
          <Eye className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-foreground">Your watchlist is empty</h3>
          <p className="text-sm text-muted-foreground mb-4">Add pairs you want to monitor closely.</p>
          <Button variant="outline" onClick={() => setOpen(true)}>Add your first pair</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchlist?.map((item) => (
            <Card key={item.id} className="bg-card border-border hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-xl font-bold font-mono tracking-tight">{item.pair}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                {item.notes ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic opacity-50">No notes provided</p>
                )}
              </CardContent>
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                Added {new Date(item.createdAt).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
