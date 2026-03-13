import { FormEvent, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import {
  adminAddScheme,
  adminDeleteScheme,
  adminUpdateScheme,
  getAdminStats,
  getSchemes,
} from "@/lib/api";
import type { Scheme } from "@/components/SchemeCard";

const initialForm = {
  scheme_name: "",
  description: "",
  eligibility: "",
  benefits: "",
  category: "",
  state: "",
  official_link: "",
  official_department: "",
  application_mode: "",
  guidance: "",
  helpline: "",
  required_documents: "",
};

const pageSize = 15;

const Admin = () => {
  const [stats, setStats] = useState<any>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [createForm, setCreateForm] = useState(initialForm);
  const [editingSchemeId, setEditingSchemeId] = useState<string>("");
  const [editingForm, setEditingForm] = useState(initialForm);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const categoryOptions = useMemo(() => Object.keys(stats?.categories || {}).sort(), [stats]);
  const stateOptions = useMemo(() => Object.keys(stats?.states || {}).sort(), [stats]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refreshData = async () => {
    setLoading(true);
    const [statsData, schemeData] = await Promise.all([
      getAdminStats(),
      getSchemes({
        page,
        limit: pageSize,
        search,
        category: category || undefined,
        state: stateFilter || undefined,
      }),
    ]);
    setStats(statsData);
    setSchemes(schemeData.items);
    setTotal(schemeData.total);
    setLoading(false);
  };

  useEffect(() => {
    void refreshData();
  }, [page, search, category, stateFilter]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adminAddScheme({
        ...createForm,
        required_documents: createForm.required_documents.split("\n").map((item) => item.trim()).filter(Boolean),
      });
      setCreateForm(initialForm);
      setStatus("Scheme added successfully");
      await refreshData();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to add scheme");
    }
  };

  const onUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSchemeId) {
      setStatus("Select a scheme to update");
      return;
    }

    const payload = Object.fromEntries(
      Object.entries({
        ...editingForm,
        required_documents: editingForm.required_documents
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }).filter(([, value]) => Array.isArray(value) ? value.length > 0 : value)
    );
    try {
      await adminUpdateScheme(editingSchemeId, payload);
      setStatus("Scheme updated successfully");
      setEditingSchemeId("");
      setEditingForm(initialForm);
      await refreshData();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update scheme");
    }
  };

  const onDelete = async (schemeId: string) => {
    try {
      await adminDeleteScheme(schemeId);
      if (editingSchemeId === schemeId) {
        setEditingSchemeId("");
        setEditingForm(initialForm);
      }
      setStatus("Scheme deleted successfully");
      await refreshData();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete scheme");
    }
  };

  const startEdit = (scheme: Scheme) => {
    setEditingSchemeId(scheme.id);
    setEditingForm({
      scheme_name: scheme.name,
      description: scheme.description || "",
      eligibility: scheme.eligibility,
      benefits: scheme.benefits,
      category: scheme.category || "",
      state: scheme.state || "",
      official_link: scheme.applyLink,
      official_department: scheme.officialDepartment || "",
      application_mode: scheme.applicationMode || "",
      guidance: scheme.guidance || "",
      helpline: scheme.helpline || "",
      required_documents: (scheme.documents || []).join("\n"),
    });
    setStatus("");
  };

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setCategory("");
    setStateFilter("");
  };

  const formFieldClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const textareaClass = `${formFieldClass} min-h-24`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage schemes and monitor platform stats.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Schemes</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{String(stats?.total_schemes || 0)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{String(stats?.total_users || 0)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Loaded Records</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{String(total)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[360px,1fr]">
          <form onSubmit={onAdd} className="space-y-3 rounded-lg border bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Add Scheme</h2>
            <input placeholder="Scheme name" value={createForm.scheme_name} onChange={(e) => setCreateForm((prev) => ({ ...prev, scheme_name: e.target.value }))} className={formFieldClass} />
            <textarea placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} className={textareaClass} />
            <textarea placeholder="Eligibility" value={createForm.eligibility} onChange={(e) => setCreateForm((prev) => ({ ...prev, eligibility: e.target.value }))} className={textareaClass} />
            <textarea placeholder="Benefits" value={createForm.benefits} onChange={(e) => setCreateForm((prev) => ({ ...prev, benefits: e.target.value }))} className={textareaClass} />
            <input placeholder="Category" value={createForm.category} onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))} className={formFieldClass} />
            <input placeholder="State" value={createForm.state} onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value }))} className={formFieldClass} />
            <input placeholder="Official link" value={createForm.official_link} onChange={(e) => setCreateForm((prev) => ({ ...prev, official_link: e.target.value }))} className={formFieldClass} />
            <input placeholder="Official department" value={createForm.official_department} onChange={(e) => setCreateForm((prev) => ({ ...prev, official_department: e.target.value }))} className={formFieldClass} />
            <input placeholder="Application mode" value={createForm.application_mode} onChange={(e) => setCreateForm((prev) => ({ ...prev, application_mode: e.target.value }))} className={formFieldClass} />
            <input placeholder="Helpline" value={createForm.helpline} onChange={(e) => setCreateForm((prev) => ({ ...prev, helpline: e.target.value }))} className={formFieldClass} />
            <textarea placeholder="Guidance" value={createForm.guidance} onChange={(e) => setCreateForm((prev) => ({ ...prev, guidance: e.target.value }))} className={textareaClass} />
            <textarea placeholder="Required documents, one per line" value={createForm.required_documents} onChange={(e) => setCreateForm((prev) => ({ ...prev, required_documents: e.target.value }))} className={textareaClass} />
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Add Scheme
            </button>
          </form>

          <div className="rounded-lg border bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Scheme Catalog</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search, filter, edit in place, and paginate through the full dataset.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[620px]">
                <SearchBar value={search} onChange={(value) => { setPage(1); setSearch(value); }} placeholder="Search scheme names or keywords" />
                <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} className={formFieldClass}>
                  <option value="">All categories</option>
                  {categoryOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select value={stateFilter} onChange={(e) => { setPage(1); setStateFilter(e.target.value); }} className={formFieldClass}>
                  <option value="">All states</option>
                  {stateOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{loading ? "Loading schemes..." : `Showing ${schemes.length} of ${total} schemes`}</span>
              <button type="button" onClick={resetFilters} className="rounded-md border px-3 py-1.5 hover:bg-muted">Reset filters</button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Scheme</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Benefits</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {schemes.map((scheme) => (
                    <>
                      <tr key={scheme.id} className="align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{scheme.name}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{scheme.description || scheme.eligibility}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{scheme.category || "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{scheme.state || "-"}</td>
                        <td className="max-w-sm px-4 py-3 text-muted-foreground">
                          <div className="line-clamp-2">{scheme.benefits}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => startEdit(scheme)} className="rounded-md border px-3 py-1.5 hover:bg-muted">Edit</button>
                            <button type="button" onClick={() => void onDelete(scheme.id)} className="rounded-md bg-destructive px-3 py-1.5 text-destructive-foreground">Delete</button>
                          </div>
                        </td>
                      </tr>
                      {editingSchemeId === scheme.id && (
                        <tr key={`${scheme.id}-editor`}>
                          <td colSpan={5} className="bg-background/60 px-4 py-4">
                            <form onSubmit={onUpdate} className="grid gap-3 lg:grid-cols-2">
                              <input value={editingForm.scheme_name} onChange={(e) => setEditingForm((prev) => ({ ...prev, scheme_name: e.target.value }))} className={formFieldClass} placeholder="Scheme name" />
                              <input value={editingForm.official_link} onChange={(e) => setEditingForm((prev) => ({ ...prev, official_link: e.target.value }))} className={formFieldClass} placeholder="Official link" />
                              <input value={editingForm.category} onChange={(e) => setEditingForm((prev) => ({ ...prev, category: e.target.value }))} className={formFieldClass} placeholder="Category" />
                              <input value={editingForm.state} onChange={(e) => setEditingForm((prev) => ({ ...prev, state: e.target.value }))} className={formFieldClass} placeholder="State" />
                              <input value={editingForm.official_department} onChange={(e) => setEditingForm((prev) => ({ ...prev, official_department: e.target.value }))} className={formFieldClass} placeholder="Official department" />
                              <input value={editingForm.application_mode} onChange={(e) => setEditingForm((prev) => ({ ...prev, application_mode: e.target.value }))} className={formFieldClass} placeholder="Application mode" />
                              <textarea value={editingForm.description} onChange={(e) => setEditingForm((prev) => ({ ...prev, description: e.target.value }))} className={textareaClass} placeholder="Description" />
                              <textarea value={editingForm.eligibility} onChange={(e) => setEditingForm((prev) => ({ ...prev, eligibility: e.target.value }))} className={textareaClass} placeholder="Eligibility" />
                              <textarea value={editingForm.guidance} onChange={(e) => setEditingForm((prev) => ({ ...prev, guidance: e.target.value }))} className={textareaClass} placeholder="Guidance" />
                              <input value={editingForm.helpline} onChange={(e) => setEditingForm((prev) => ({ ...prev, helpline: e.target.value }))} className={formFieldClass} placeholder="Helpline" />
                              <textarea value={editingForm.benefits} onChange={(e) => setEditingForm((prev) => ({ ...prev, benefits: e.target.value }))} className={textareaClass} placeholder="Benefits" />
                              <textarea value={editingForm.required_documents} onChange={(e) => setEditingForm((prev) => ({ ...prev, required_documents: e.target.value }))} className={textareaClass} placeholder="Required documents, one per line" />
                              <div className="flex gap-2 lg:col-span-2">
                                <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Save changes</button>
                                <button type="button" onClick={() => { setEditingSchemeId(""); setEditingForm(initialForm); }} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {!loading && schemes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No schemes found for the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-md border px-3 py-1.5 disabled:opacity-50">Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="rounded-md border px-3 py-1.5 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>

        {status && <p className="mt-6 text-sm text-muted-foreground">{status}</p>}
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
