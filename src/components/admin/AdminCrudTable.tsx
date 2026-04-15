import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

type AdminCrudTableProps = {
  title: string;
  description?: string;
  rows: any[];
  loading?: boolean;
  hiddenColumns?: string[];
  hiddenFormFields?: string[];
  createDefaults?: Record<string, any>;
  fieldOptions?: Record<string, string[]>;
  fieldSelectOptions?: Record<string, Array<{ label: string; value: string }>>;
  fieldInputTypes?: Record<string, "text" | "number" | "date">;
  allowCreate?: boolean;
  renderRowActions?: (row: any) => ReactNode;
  showSearchInput?: boolean;
  showDefaultDetailsAction?: boolean;
  onRefresh: () => void | Promise<void>;
  onCreate: (payload: Record<string, any>) => void | Promise<void>;
  onUpdate: (id: number, payload: Record<string, any>) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
};

const getType = (value: any): "boolean" | "number" | "string" => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
};

export default function AdminCrudTable({
  title,
  description,
  rows,
  loading = false,
  hiddenColumns = [],
  hiddenFormFields = [],
  createDefaults,
  fieldOptions = {},
  fieldSelectOptions = {},
  fieldInputTypes = {},
  allowCreate = true,
  renderRowActions,
  showSearchInput = true,
  showDefaultDetailsAction = true,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: AdminCrudTableProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, "boolean" | "number" | "string">>({});
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState<Record<string, any> | null>(null);

  const hiddenSet = useMemo(() => new Set(hiddenColumns), [hiddenColumns]);
  const hiddenFormSet = useMemo(() => new Set(hiddenFormFields), [hiddenFormFields]);
  const prettifyLabel = (value: string) =>
    value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (s) => s.toUpperCase());

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.slice(0, 10).forEach((row) => {
      Object.keys(row || {}).forEach((k) => {
        if (!hiddenSet.has(k)) keys.add(k);
      });
    });
    return [...keys].slice(0, 6);
  }, [rows, hiddenSet]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) => JSON.stringify(row || {}).toLowerCase().includes(term));
  }, [rows, search]);

  const buildFormSchema = (source: Record<string, any>) => {
    const nextValues: Record<string, any> = {};
    const nextTypes: Record<string, "boolean" | "number" | "string"> = {};
    Object.entries(source || {}).forEach(([key, value]) => {
      if (key === "id" || key === "createdAt" || key === "updatedAt" || key === "deletedAt") return;
      if (hiddenSet.has(key)) return;
      if (hiddenFormSet.has(key)) return;
      nextTypes[key] = getType(value);
      nextValues[key] = value ?? (nextTypes[key] === "boolean" ? false : "");
    });
    setFieldTypes(nextTypes);
    setFormValues(nextValues);
  };

  const openCreate = () => {
    setEditId(null);
    buildFormSchema(createDefaults || rows[0] || {});
    setDialogOpen(true);
  };

  const openEdit = (row: any) => {
    setEditId(Number(row?.id));
    buildFormSchema(row || {});
    setDialogOpen(true);
  };

  const openDetails = (row: any) => {
    setDetailsRow(row || null);
    setDetailsOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsed: Record<string, any> = {};
      Object.entries(formValues).forEach(([key, value]) => {
        const t = fieldTypes[key];
        if (t === "number") {
          parsed[key] = Number(value || 0);
        } else if (t === "boolean") {
          parsed[key] = Boolean(value);
        } else {
          parsed[key] = typeof value === "string" ? value.trim() : value;
        }
      });
      if (editId == null) {
        await onCreate(parsed);
      } else {
        await onUpdate(editId, parsed);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {showSearchInput && (
            <Input
              placeholder="Search rows..."
              className="max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <Button variant="outline" onClick={() => void onRefresh()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          {allowCreate && (
            <Button className="gradient-primary" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Row
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border/80 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="py-8 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                    No data found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row: any) => (
                  <TableRow key={row?.id ?? JSON.stringify(row)}>
                    {columns.map((c) => (
                      <TableCell key={c} className="max-w-[220px] truncate">
                        {String(row?.[c] ?? "-")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {renderRowActions ? renderRowActions(row) : null}
                        <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {showDefaultDetailsAction && (
                          <Button size="icon" variant="ghost" onClick={() => openDetails(row)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void onDelete(Number(row?.id))}
                          disabled={row?.id == null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editId == null ? "Create Row" : `Update Row #${editId}`}</DialogTitle>
            <DialogDescription>Fill in the form fields and save.</DialogDescription>
          </DialogHeader>
          {Object.keys(formValues).length === 0 ? (
            <p className="text-sm text-muted-foreground">No editable fields detected for this row.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(formValues).map(([key, value]) => {
                const t = fieldTypes[key];
                if (t === "boolean") {
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={Boolean(value)}
                        onCheckedChange={(checked) =>
                          setFormValues((prev) => ({ ...prev, [key]: checked === true }))
                        }
                      />
                      {key}
                    </label>
                  );
                }
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium">{prettifyLabel(key)}</label>
                    {fieldSelectOptions[key]?.length ? (
                      <Select
                        value={value == null ? "" : String(value)}
                        onValueChange={(next) => setFormValues((prev) => ({ ...prev, [key]: next }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${prettifyLabel(key)}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldSelectOptions[key].map((option) => (
                            <SelectItem key={`${key}-${option.value}`} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : fieldOptions[key]?.length ? (
                      <Select
                        value={value == null ? "" : String(value)}
                        onValueChange={(next) => setFormValues((prev) => ({ ...prev, [key]: next }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${prettifyLabel(key)}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions[key].map((option) => (
                            <SelectItem key={option} value={option}>
                              {prettifyLabel(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={fieldInputTypes[key] || (t === "number" ? "number" : "text")}
                        value={
                          fieldInputTypes[key] === "date"
                            ? (value ? String(value).slice(0, 10) : "")
                            : value == null
                              ? ""
                              : String(value)
                        }
                        onChange={(e) => {
                          const next = fieldInputTypes[key] === "date" ? e.target.value : e.target.value;
                          setFormValues((prev) => ({ ...prev, [key]: next }));
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showDefaultDetailsAction && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Row Details {detailsRow?.id != null ? `#${detailsRow.id}` : ""}
              </DialogTitle>
              <DialogDescription>Detailed information for the selected row.</DialogDescription>
            </DialogHeader>
            {!detailsRow ? (
              <p className="text-sm text-muted-foreground">No data available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {Object.entries(detailsRow).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-border p-3 bg-card/40">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {prettifyLabel(key)}
                    </p>
                    <p className="mt-1 text-sm break-words">
                      {value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
