import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, type RefObject } from "react";
import { Pencil, Plus, Image, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { categoryApi, fileUrl, type AgeCategory } from "@/lib/api";
import { Card, Button } from "@/components/admin/ui";
import { Modal, FormField, inputClass, textareaClass } from "@/components/admin/Modal";

export const Route = createFileRoute("/_admin/categories")({ component: CategoriesPage });

function CategoriesPage() {
  const qc = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryApi.list });
  const [editing, setEditing] = useState<AgeCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const imgRef = useRef<HTMLInputElement | null>(null);

  const updateMut = useMutation({
    mutationFn: ({ data, image }: { data: AgeCategory; image?: File }) => {
      const { _count, contentCount, ...cleanData } = data as any;
      return categoryApi.update(data.id, cleanData, image);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Category updated");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: ({ data, image }: { data: Partial<AgeCategory>; image?: File }) =>
      categoryApi.create(data, image),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Category created");
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New category
        </Button>
      </div>

      {categories.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load categories. Is the backend running?
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {categories.isPending &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />
          ))}

        {categories.data?.map((c) => (
          <Card key={c.id} className="overflow-hidden group">
            {/* Header with image or colour */}
            <div
              className="h-28 p-5 flex items-end justify-between relative"
              style={{ backgroundColor: c.bgColor }}
            >
              {c.imageUrl && (
                <img
                  src={fileUrl(c.imageUrl)}
                  alt={c.label}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="relative z-10">
                <div className="font-display text-3xl font-bold" style={{ color: c.color }}>
                  {c.label}
                </div>
                <div className="text-sm font-semibold" style={{ color: c.color }}>
                  {c.sublabel}
                </div>
              </div>
              <button
                onClick={() => setEditing(c)}
                className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity size-9 rounded-xl bg-white/70 backdrop-blur grid place-items-center hover:bg-white shadow-sm"
                style={{ color: c.color }}
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                {c.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {c.contentCount ?? 0} lessons
                </span>
                <Button variant="ghost" onClick={() => setEditing(c)} className="h-8 text-xs">
                  <Pencil className="size-3.5" /> Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit modal */}
      <CategoryModal
        key={editing?.id}
        category={editing}
        saving={updateMut.isPending}
        onClose={() => setEditing(null)}
        onSave={(data, image) => updateMut.mutate({ data, image })}
      />

      {/* Create modal */}
      <CreateCategoryModal
        open={creating}
        saving={createMut.isPending}
        onClose={() => setCreating(false)}
        onSave={(data, image) => createMut.mutate({ data, image })}
      />
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function CategoryModal({
  category,
  saving,
  onClose,
  onSave,
}: {
  category: AgeCategory | null;
  saving: boolean;
  onClose: () => void;
  onSave: (c: AgeCategory, image?: File) => void;
}) {
  const [form, setForm] = useState<AgeCategory | null>(category);
  const [image, setImage] = useState<File | undefined>();
  const imgRef = useRef<HTMLInputElement>(null);

  if (category && (!form || form.id !== category.id)) setForm(category);

  if (!category || !form) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${form.label} ${form.sublabel}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form, image)} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <CategoryFormFields form={form} setForm={setForm} image={image} setImage={setImage} imgRef={imgRef} />
    </Modal>
  );
}

// ── Create Modal ───────────────────────────────────────────────────────────────

const emptyCategory: Partial<AgeCategory> = {
  id: "",
  label: "",
  sublabel: "Months",
  color: "#16a34a",
  bgColor: "#dcfce7",
  iconName: "baby",
  description: "",
};

function CreateCategoryModal({
  open,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Partial<AgeCategory>, image?: File) => void;
}) {
  const [form, setForm] = useState<Partial<AgeCategory>>(emptyCategory);
  const [image, setImage] = useState<File | undefined>();
  const imgRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New age category"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form, image)} disabled={saving}>
            {saving ? "Creating…" : "Create category"}
          </Button>
        </>
      }
    >
      <CategoryFormFields
        form={form as AgeCategory}
        setForm={(f) => setForm(f)}
        image={image}
        setImage={setImage}
        imgRef={imgRef}
        showId
      />
    </Modal>
  );
}

// ── Shared fields ──────────────────────────────────────────────────────────────

function CategoryFormFields({
  form,
  setForm,
  image,
  setImage,
  imgRef,
  showId = false,
}: {
  form: AgeCategory;
  setForm: (f: AgeCategory) => void;
  image?: File;
  setImage: (f?: File) => void;
  imgRef: React.RefObject<HTMLInputElement | null>;
  showId?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showId && (
        <FormField label="ID" hint="e.g. 0-6, 7-12">
          <input
            required
            className={inputClass}
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="0-6"
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Label">
          <input
            required
            className={inputClass}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="0 – 6"
          />
        </FormField>
        <FormField label="Sublabel">
          <input
            required
            className={inputClass}
            value={form.sublabel}
            onChange={(e) => setForm({ ...form, sublabel: e.target.value })}
            placeholder="Months"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Accent colour" hint="hex">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="size-10 rounded-lg border bg-card cursor-pointer shrink-0"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <input
              className={inputClass}
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
        </FormField>
        <FormField label="Background colour" hint="hex">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="size-10 rounded-lg border bg-card cursor-pointer shrink-0"
              value={form.bgColor}
              onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
            />
            <input
              className={inputClass}
              value={form.bgColor}
              onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
            />
          </div>
        </FormField>
      </div>

      <FormField label="Description">
        <textarea
          rows={3}
          className={textareaClass}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>

      <FormField label="Icon name" hint="lucide icon identifier">
        <input
          className={inputClass}
          value={form.iconName}
          onChange={(e) => setForm({ ...form, iconName: e.target.value })}
          placeholder="baby"
        />
      </FormField>

      <FormField label="Cover image" hint="optional">
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImage(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className={`${inputClass} flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer`}
        >
          <Image className="size-4" />
          {image ? image.name : "Choose image"}
        </button>
      </FormField>
    </div>
  );
}
