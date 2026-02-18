"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createEvent, createProduct, deleteProduct, updateProduct } from "@/app/admin/actions";
import { cacheClear } from "@/service/api-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export type AdminOption = { id: number; name: string };

interface AdminClientProps {
  categories: AdminOption[];
  products: AdminOption[];
  userEmail?: string;
}

export function AdminClient({ categories, products, userEmail }: AdminClientProps) {
  const [isPending, startTransition] = useTransition();
  const [createForm, setCreateForm] = useState({ name: "", price: "", stock: "", categoryId: "" });
  const [updateForm, setUpdateForm] = useState({ id: "", price: "", stock: "" });
  const [eventForm, setEventForm] = useState({ type: "restock", message: "", productId: "" });
  const [deleteProductId, setDeleteProductId] = useState("");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCreate = () => {
    const formData = new FormData();
    formData.set("name", createForm.name);
    formData.set("price", createForm.price);
    formData.set("stock", createForm.stock);
    if (createForm.categoryId) formData.set("categoryId", createForm.categoryId);

    startTransition(async () => {
      const result = await createProduct(formData);
      if (result.ok) {
        cacheClear();
        toast.success(result.message);
        setCreateForm({ name: "", price: "", stock: "", categoryId: "" });
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleUpdate = () => {
    const formData = new FormData();
    formData.set("id", updateForm.id);
    formData.set("price", updateForm.price);
    formData.set("stock", updateForm.stock);

    startTransition(async () => {
      const result = await updateProduct(formData);
      if (result.ok) {
        cacheClear();
        toast.success(result.message);
        setUpdateDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleEvent = () => {
    const formData = new FormData();
    formData.set("type", eventForm.type);
    formData.set("message", eventForm.message);
    if (eventForm.productId) formData.set("productId", eventForm.productId);

    startTransition(async () => {
      const result = await createEvent(formData);
      if (result.ok) {
        cacheClear();
        toast.success(result.message);
        setEventForm({ type: "restock", message: "", productId: "" });
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    const id = Number(deleteProductId);
    startTransition(async () => {
      const result = await deleteProduct(id);
      setDeleteDialogOpen(false);
      if (result.ok) {
        cacheClear();
        toast.success(result.message);
        setDeleteProductId("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const categoryOptions: ComboboxOption[] = [
    { value: "", label: "Nenhuma (opcional)" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const productOptions: ComboboxOption[] = [
    { value: "", label: "Selecionar produto..." },
    ...products.map((p) => ({ value: String(p.id), label: `${p.name} (#${p.id})` })),
  ];

  const eventTypeOptions: ComboboxOption[] = [
    { value: "restock", label: "Reabastecimento" },
    { value: "price_change", label: "Alteração de preço" },
    { value: "pulse", label: "Pulse" },
  ];

  const eventProductOptions: ComboboxOption[] = [
    { value: "", label: "Nenhum" },
    ...products.map((p) => ({ value: String(p.id), label: `${p.name} (#${p.id})` })),
  ];

  return (
    <Tabs defaultValue="create" className="space-y-5">
      <TabsList>
        <TabsTrigger value="create">Criar Produto</TabsTrigger>
        <TabsTrigger value="update">Atualizar Produto</TabsTrigger>
        <TabsTrigger value="event">Criar Evento</TabsTrigger>
        <TabsTrigger value="delete">Apagar Produto</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h3 className="text-base font-semibold">Novo Produto</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</label>
                <Input
                  placeholder="Ex: MacBook Pro M4"
                  aria-label="Nome do produto"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Preço (R$)</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  aria-label="Preço do produto"
                  value={createForm.price}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Estoque</label>
                <Input
                  placeholder="0"
                  type="number"
                  aria-label="Estoque do produto"
                  value={createForm.stock}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</label>
                <Combobox
                  options={categoryOptions}
                  value={createForm.categoryId}
                  onChange={(val) => setCreateForm((prev) => ({ ...prev, categoryId: val }))}
                  placeholder="Nenhuma (opcional)"
                  aria-label="Categoria do produto"
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={isPending} className="cta-btn">
              {isPending ? "Salvando..." : "Criar Produto"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="update">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h3 className="text-base font-semibold">Atualizar Produto</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Produto</label>
                <Combobox
                  options={productOptions}
                  value={updateForm.id}
                  onChange={(val) => setUpdateForm((prev) => ({ ...prev, id: val }))}
                  placeholder="Selecionar produto..."
                  aria-label="Selecionar produto"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Novo Preço (R$)</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  aria-label="Novo preço"
                  value={updateForm.price}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Novo Estoque</label>
                <Input
                  placeholder="0"
                  type="number"
                  aria-label="Novo estoque"
                  value={updateForm.stock}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>
            <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isPending || !updateForm.id} className="cta-btn">
                  Revisar Alteração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Alteração</DialogTitle>
                  <DialogDescription>
                    Deseja atualizar o preço e o estoque do produto selecionado? Essa ação invalidará o cache automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <Separator />
                <DialogFooter>
                  <Button variant="secondary" type="button" onClick={handleUpdate} disabled={isPending}>
                    {isPending ? "Atualizando..." : "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="event">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h3 className="text-base font-semibold">Criar Evento</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</label>
                <Combobox
                  options={eventTypeOptions}
                  value={eventForm.type}
                  onChange={(val) => setEventForm((prev) => ({ ...prev, type: val }))}
                  placeholder="Selecionar tipo..."
                  aria-label="Tipo de evento"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Produto (opcional)</label>
                <Combobox
                  options={eventProductOptions}
                  value={eventForm.productId}
                  onChange={(val) => setEventForm((prev) => ({ ...prev, productId: val }))}
                  placeholder="Nenhum"
                  aria-label="Produto do evento"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Mensagem</label>
                <Input
                  placeholder="Descreva o evento..."
                  aria-label="Mensagem do evento"
                  value={eventForm.message}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleEvent} disabled={isPending} className="cta-btn">
              {isPending ? "Salvando..." : "Criar Evento"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="delete">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h3 className="text-base font-semibold">Apagar Produto</h3>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Produto</label>
              <Combobox
                options={productOptions}
                value={deleteProductId}
                onChange={setDeleteProductId}
                placeholder="Selecionar produto..."
                aria-label="Selecionar produto para apagar"
              />
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isPending || !deleteProductId} variant="destructive">
                  Apagar Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    Essa ação é irreversível. O produto <strong>&quot;{products.find((p) => String(p.id) === deleteProductId)?.name}&quot;</strong> e todos os eventos associados a ele serão apagados permanentemente.
                  </DialogDescription>
                </DialogHeader>
                {userEmail && (
                  <p className="text-xs text-muted-foreground">
                    Ação executada por <strong>{userEmail}</strong>
                  </p>
                )}
                <Separator />
                <DialogFooter>
                  <Button variant="destructive" type="button" onClick={handleDelete} disabled={isPending}>
                    {isPending ? "Apagando..." : "Apagar definitivamente"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
