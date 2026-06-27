import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  FileText, Music, Video, Plus, Pencil, Trash2,
  Search, Upload, ExternalLink, Eye, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { contentApi, categoryApi, type Content, type ContentType, fileUrl } from "@/lib/api";
import { Card, Button, Badge } from "@/components/admin/ui";
import { Modal, ConfirmDialog, FormField, inputClass, textareaClass } from "@/components/admin/Modal";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_admin/lessons")({ component: LessonsPage });

const typeMeta: Record<ContentType, { icon: React.ElementType; label: string; tone: string }> = {
  text:  { icon: FileText, label: "Document", tone: "text-primary" },
  audio: { icon: Music,    label: "Audio",    tone: "text-success" },
  video: { icon: Video,    label: "Video",    tone: "text-warning-foreground" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

function LessonsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const lessons = useQuery({ queryKey: ["contents"], queryFn: contentApi.list });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryApi.list });

  const [modal, setModal] = useState<{ open: boolean; editing?: Content }>({ open: false });
  const [toDelete, setToDelete] = useState<Content | null>(null);
  const [preview, setPreview] = useState<Content | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ContentType | "all">("all");

  const saveMut = useMutation({
    mutationFn: ({ data, file }: { data: Partial<Content> & { postedById?: number }; file?: File }) => {
      const withAuthor = { ...data, postedById: data.postedById ?? user?.id ?? 1 };
      return modal.editing
        ? contentApi.update(modal.editing.id, withAuthor, file)
        : contentApi.create(withAuthor as any, file);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(modal.editing ? "Lesson updated" : "Lesson created");
      setModal({ open: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => contentApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Lesson deleted");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (lessons.data ?? []).filter((l) => {
    const matchType = filterType === "all" || l.type === filterType;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "text", "audio", "video"] as const).map((t) => (
            <FilterChip key={t} active={filterType === t} onClick={() => setFilterType(t)}>
              {t === "all" ? "All" : (
                <>
                  {(() => { const I = typeMeta[t as ContentType].icon; return <I className="size-3.5" />; })()}
                  {typeMeta[t as ContentType].label}
                </>
              )}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg border bg-card w-64">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lessons…"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <Button onClick={() => setModal({ open: true })}>
            <Plus className="size-4" /> New lesson
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {lessons.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load lessons. Is the backend running?
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Age group</th>
                <th className="px-5 py-3 font-medium">Posted by</th>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lessons.isPending &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))}
              {filtered.map((item) => {
                const Icon = typeMeta[item.type].icon;
                const tone = typeMeta[item.type].tone;
                const url = fileUrl(item.fileUrl);
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-medium text-foreground truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone}`}>
                        <Icon className="size-3.5" /> {typeMeta[item.type].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {item.ageGroup} months
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {item.postedBy?.name ?? item.postedByName ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {url ? (
                        <button
                          onClick={() => setPreview(item)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Eye className="size-3" /> View
                        </button>
                      ) : item.textContent ? (
                        <button
                          onClick={() => setPreview(item)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Eye className="size-3" /> View
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.isNew ? <Badge tone="success">New</Badge> : <Badge>Published</Badge>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setModal({ open: true, editing: item })}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setToDelete(item)}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!lessons.isPending && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No lessons match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <LessonModal
        key={modal.editing?.id ?? "new"}
        open={modal.open}
        editing={modal.editing}
        categories={categories.data ?? []}
        saving={saveMut.isPending}
        onClose={() => setModal({ open: false })}
        onSave={(data, file) => saveMut.mutate({ data, file })}
      />

      <PreviewModal
        open={!!preview}
        content={preview}
        onClose={() => setPreview(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Delete lesson?"
        description={`This will permanently remove "${toDelete?.title}". This action cannot be undone.`}
      />
    </div>
  );
}

// ── FilterChip ────────────────────────────────────────────────────────────────

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border hover:bg-muted text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ── Lesson Modal ──────────────────────────────────────────────────────────────

function LessonModal({
  open,
  editing,
  categories,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing?: Content;
  categories: { id: string; label: string; sublabel: string }[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<Content>, file?: File) => void;
}) {
  const [form, setForm] = useState<Partial<Content>>(
    editing ?? { type: "text", ageGroup: categories[0]?.id ?? "", isNew: true }
  );
  const [file, setFile] = useState<File | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, file);
  };

  const needsFile = form.type === "audio" || form.type === "video";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit lesson" : "Add new lesson"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create lesson"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Title *">
          <input
            required
            className={inputClass}
            value={form.title ?? ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Breastfeeding basics for newborns"
          />
        </FormField>

        <FormField label="Description *">
          <textarea
            required
            rows={3}
            className={textareaClass}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description shown to parents…"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Content type *">
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ContentType, fileUrl: undefined, textContent: undefined })}
            >
              <option value="text">Document / Text</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </FormField>

          <FormField label="Age group *">
            <select
              className={inputClass}
              value={form.ageGroup}
              onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} {c.sublabel}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {form.type === "text" ? (
          <>
            <FormField label="Text content">
              <textarea
                rows={7}
                className={textareaClass}
                value={form.textContent ?? ""}
                onChange={(e) => setForm({ ...form, textContent: e.target.value })}
                placeholder="Full lesson text content…"
              />
            </FormField>
            <FormField label="Or upload a document (PDF / DOCX)" hint="optional">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`${inputClass} flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer`}
              >
                <Upload className="size-4" />
                {file ? file.name : (editing?.fileUrl ? "Replace existing file" : "Choose file")}
              </button>
            </FormField>
          </>
        ) : (
          <div className="space-y-4">
            <FormField label={`Upload ${form.type === "audio" ? "audio file" : "video file"} *`}>
              <input
                ref={fileRef}
                type="file"
                accept={form.type === "audio" ? "audio/*" : "video/*"}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`${inputClass} flex items-center gap-2 cursor-pointer ${
                  file ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="size-4" />
                {file ? file.name : (editing?.fileUrl ? "Replace existing file" : `Choose ${form.type} file`)}
              </button>
              {editing?.fileUrl && !file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current:{" "}
                  <a href={fileUrl(editing.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View file
                  </a>
                </p>
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Or file URL" hint="if hosted elsewhere">
                <input
                  className={inputClass}
                  value={form.fileUrl ?? ""}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://…"
                />
              </FormField>
              <FormField label="Duration">
                <input
                  className={inputClass}
                  value={form.duration ?? ""}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 4:30"
                />
              </FormField>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isNew"
            className="rounded"
            checked={form.isNew ?? true}
            onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
          />
          <label htmlFor="isNew" className="text-sm text-muted-foreground cursor-pointer">
            Mark as <strong>New</strong> (highlighted for parents)
          </label>
        </div>
      </form>
    </Modal>
  );
}


// ── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  open,
  content,
  onClose,
}: {
  open: boolean;
  content: Content | null;
  onClose: () => void;
}) {
  if (!content) return null;

  const url = fileUrl(content.fileUrl);
  const Icon = typeMeta[content.type].icon;

  // Check file types
  const isPDF = url && url.toLowerCase().endsWith('.pdf');
  const isWord = url && (url.toLowerCase().endsWith('.docx') || url.toLowerCase().endsWith('.doc'));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={content.title}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button variant="primary">
                <ExternalLink className="size-4" /> Open in New Tab
              </Button>
            </a>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Content header */}
        <div className="flex items-start gap-3 pb-4 border-b">
          <div className={`size-10 rounded-lg grid place-items-center ${
            content.type === "text" ? "bg-primary/10 text-primary" :
            content.type === "audio" ? "bg-success/15 text-success" :
            "bg-warning/20 text-warning-foreground"
          }`}>
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{typeMeta[content.type].label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {content.ageGroup} months
              {content.duration && ` · ${content.duration}`}
            </div>
          </div>
        </div>

        {/* Description */}
        {content.description && (
          <div className="text-sm text-muted-foreground">
            {content.description}
          </div>
        )}

        {/* Content viewer */}
        <div className="rounded-lg border bg-muted/30 overflow-hidden">
          {/* For text type with file */}
          {content.type === "text" && url && (
            <div className="space-y-2">
              <div className="h-[70vh] border rounded overflow-hidden bg-white">
                {isPDF ? (
                  <embed
                    key={url}
                    src={url}
                    type="application/pdf"
                    className="w-full h-full"
                    title={content.title}
                  />
                ) : isWord ? (
                  <iframe
                    key={url}
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                    className="w-full h-full border-0"
                    title={content.title}
                  />
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Cannot preview this file type in browser
                    </p>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button>Open File</Button>
                    </a>
                  </div>
                )}
              </div>
              {/* File info */}
              <div className="text-xs text-muted-foreground break-all px-2 py-1">
                File: {url}
              </div>
            </div>
          )}

          {/* Only show extracted text if there's no file */}
          {content.type === "text" && !url && content.textContent && (
            <div className="p-6 max-h-[60vh] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{content.textContent}</pre>
            </div>
          )}

          {content.type === "audio" && url && (
            <div className="p-8 flex flex-col items-center justify-center gap-4">
              <div className="size-24 rounded-full bg-success/20 grid place-items-center">
                <Music className="size-12 text-success" />
              </div>
              <div className="w-full max-w-md">
                <audio
                  key={url}
                  controls
                  controlsList="nodownload"
                  className="w-full"
                  preload="auto"
                  onError={(e) => {
                    console.error('Audio loading error:', e);
                    console.error('Audio URL:', url);
                  }}
                >
                  <source src={url} type="audio/mpeg" />
                  <source src={url} type="audio/mp4" />
                  <source src={url} type="audio/aac" />
                  <source src={url} type="audio/wav" />
                  Your browser does not support audio playback.
                </audio>
                <div className="mt-2 text-xs text-muted-foreground break-all">
                  File: {url}
                </div>
              </div>
            </div>
          )}

          {content.type === "video" && url && (
            <div className="bg-black">
              <video
                key={url}
                controls
                controlsList="nodownload"
                className="w-full max-h-[70vh]"
                preload="auto"
                onError={(e) => {
                  console.error('Video loading error:', e);
                  console.error('Video URL:', url);
                }}
              >
                <source src={url} type="video/mp4" />
                <source src={url} type="video/webm" />
                <source src={url} type="video/ogg" />
                Your browser does not support video playback.
              </video>
              <div className="p-2 text-xs text-white/60 break-all">
                File: {url}
              </div>
            </div>
          )}

          {!url && !content.textContent && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No file or content available
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
