// src/pages/client/Addition.tsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Member = {
  HRCode: string;
  name: string;
  nid: string;
  phone: string;

  // ✅ added/missing fields
  email?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  additionDate?: string | null;
  relation?: string;
  principalNumber?: string | null;
  plan?: string;
  salary?: number | null;
  life_category?: string | null;

  photo_url?: string;

  // ✅ workflow field (client always submits as pending)
  approval_status?: "pending" | "approved" | "rejected";
};

export default function Addition() {
  const { user } = useAuth();

  const [view, setView] = useState<"form" | "excel">("form");
  const [members, setMembers] = useState<Member[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [requestRef, setRequestRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // manual form fields
  const [hrCode, setHrCode] = useState("");
  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [phone, setPhone] = useState("");

  

  // ✅ added fields
  
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState<string>("");
  const [lifeCategory, setLifeCategory] = useState("");

  const [additionDate, setAdditionDate] = useState("");
  const [relation, setRelation] = useState("");
  const [principalNumber, setPrincipalNumber] = useState("");
  const [plan, setPlan] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const RELATIONS = ["principal", "spouse", "son", "daughter"];
  const PLANS = ["GA1", "GA2", "GA3", "GA4"];
  

  // ---------- helpers ----------
  // ---------- Excel date helper ----------
const excelDateToISO = (value: any): string | null => {
  if (value === null || value === undefined || value === "") return null;

  // already ISO date (from manual edit or clean Excel)
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const num = Number(value);
  if (Number.isNaN(num)) return null;

  // Excel epoch: 1899-12-30
  const base = new Date(Date.UTC(1899, 11, 30));
  base.setUTCDate(base.getUTCDate() + num);

  return base.toISOString().slice(0, 10);
};

  const parseNid = (value: string) => {
    if (!value || value.length !== 14) return { dob: "", gender: "", nationality: "" };
    try {
      const century = value[0] === "2" ? 1900 : 2000;
      const year = century + parseInt(value.substring(1, 3), 10);
      const month = parseInt(value.substring(3, 5), 10);
      const day = parseInt(value.substring(5, 7), 10);
      const dob = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const genderDigit = parseInt(value[12], 10);
      const gender = genderDigit % 2 === 0 ? "Female" : "Male";
      return { dob, gender, nationality: "Egyptian" };
    } catch {
      return { dob: "", gender: "", nationality: "" };
    }
  };

  const isValidEmail = (v: string) => {
    if (!v) return true; // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  // ---------- Supabase storage helpers ----------
  async function listBucketFiles(): Promise<string[]> {
    try {
      const { data } = await supabase.storage.from("members").list("", { limit: 1000 });
      return (data || []).map((f: any) => f.name || "");
    } catch (err) {
      console.warn("listBucketFiles error", err);
      return [];
    }
  }

  async function getUniqueFilename(hr: string, ext: string) {
    const base = `${hr}.${ext}`;
    const files = await listBucketFiles();
    if (!files.includes(base)) return base;
    let i = 1;
    while (files.includes(`${hr}_${i}.${ext}`)) i++;
    return `${hr}_${i}.${ext}`;
  }

  async function uploadPhotoWithHR(file: File, hr: string): Promise<string | null> {
    if (!hr) return null;
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filename = await getUniqueFilename(hr, ext);
      const path = `members/${filename}`;
      const { error } = await supabase.storage.from("members").upload(path, file, { upsert: false });
      if (error) {
        console.error("upload error", error);
        return null;
      }
      const { data: publicData } = supabase.storage.from("members").getPublicUrl(path);
      return publicData?.publicUrl ?? null;
    } catch (err) {
      console.error("uploadPhotoWithHR unexpected", err);
      return null;
    }
  }

  // ---------- Manual add ----------
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hrCode) return setError("HR Code is required.");
    if (!name || !nid || !phone || !additionDate || !relation || !plan) return setError("Fill all mandatory fields.");
    if (!(nid.length === 14 && (nid[0] === "2" || nid[0] === "3")))
      return setError("NID must be 14 digits starting with 2 or 3.");
    if (!(phone.length === 11 && /^\d+$/.test(phone))) return setError("Phone must be 11 digits.");
    if (relation !== "principal" && !principalNumber) return setError("Principal Number required for dependents.");
    if (!isValidEmail(email)) return setError("Invalid email format.");

    let photo_url = "";
    if (photoFile) {
      setUploadingFor(hrCode);
      const url = await uploadPhotoWithHR(photoFile, hrCode);
      setUploadingFor(null);
      if (!url) {
        setError("⚠️ Failed to upload photo during manual addition.");
        return;
      }
      photo_url = url;
    }

    const parsed = parseNid(nid);
    const salaryNum = salary.trim() ? Number(salary) : null;
    if (salary.trim() && Number.isNaN(salaryNum)) return setError("Salary must be a number.");

    const newMember: Member = {
      HRCode: hrCode,
      name,
      nid,
      phone,
      email: email.trim() || undefined,
      dob: parsed.dob,
      gender: parsed.gender,
      nationality: parsed.nationality,
       additionDate: additionDate,
      relation,
      principalNumber: relation !== "principal" ? principalNumber : null,
      plan,
      salary: salaryNum,
      life_category: lifeCategory.trim() || null,
      photo_url,

      approval_status: "pending",
    };

    setMembers((prev) => [...prev, newMember]);

    // reset manual form
    setHrCode("");
    setName("");
    setNid("");
    setPhone("");
    setEmail("");
    setSalary("");
    setLifeCategory("");
    setAdditionDate("");
    setRelation("");
    setPrincipalNumber("");
    setPlan("");
    setPhotoFile(null);
  };

  // ---------- Excel import ----------
  const normalizeHeader = (header: string) =>
  header
    .toLowerCase()
    .replace(/\(.*?\)/g, "")       // remove notes
    .replace(/[*:#]/g, "")         // remove symbols
    .replace(/[\/]/g, " ")         // replace slash with space
    .replace(/\s+/g, " ")          // normalize spaces
    .trim();


const HEADER_MAP: Record<string, string> = {
  "hrcode": "hr_code",
  "insured name": "name",
  "relation": "relation",
  "class": "plan",
  "date of birth": "dob",
  "gender": "gender",
  "addition_date": "addition_date",
  "salary for life policy": "salary",
  "for dependants please add the insured card number": "principal_card_number",
  "nationality": "nationality",
  "national id passport": "nid",
  "single_married": "marital_status",
  "email": "email",
  "mobile": "phone",
  "bank details payee name": "payee_name",
  "account number": "account_number",
  "bank name": "bank_name",
  "branch address": "branch_address",
  "swift code": "swift_code",
  "iban": "iban",
};

const mapExcelRow = (row: Record<string, any>) => {
  const mapped: Record<string, any> = {};

  Object.entries(row).forEach(([rawHeader, value]) => {
    const normalized = normalizeHeader(rawHeader);
    const key = HEADER_MAP[normalized];

    if (key) {
      mapped[key] = value;
    }
  });

  return mapped;
};

const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setError("");

  const reader = new FileReader();

  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
         range: 6,
      });

      const parsedRows: Member[] = rows.map((row, index) => {
        const mapped = mapExcelRow(row);

        // 🔒 Mandatory validation
        if (!mapped.hr_code || !mapped.name || !mapped.nid) {
          throw new Error(
            `Row ${index + 8}: Missing mandatory fields (HRCode, Name, or NID)`
          );
        }

        const nidVal = String(mapped.nid).trim();
        const parsedNid = parseNid(nidVal);

        const salaryRaw = mapped.salary ?? "";
        const salaryNum =
          String(salaryRaw).trim() === ""
            ? null
            : Number(String(salaryRaw).trim());

        return {
          HRCode: String(mapped.hr_code).trim(),
          name: String(mapped.name).trim(),
          nid: nidVal,
          phone: String(mapped.phone || "").trim(),
          email: String(mapped.email || "").trim() || undefined,
          dob: parsedNid.dob,
          gender: parsedNid.gender,
          nationality: parsedNid.nationality,
          additionDate: excelDateToISO(mapped.addition_date),
          relation: String(mapped.relation || "").trim(),
          principalNumber: mapped.principal_card_number
            ? String(mapped.principal_card_number).trim()
            : null,
          plan: String(mapped.plan || "").trim(),
          salary: Number.isNaN(salaryNum as number) ? null : salaryNum,
          life_category: null, // not provided in template
          photo_url: "",
          approval_status: "pending",
        };
      });

      setMembers((prev) => [...prev, ...parsedRows]);
    } catch (err: any) {
      console.error("Excel parse error", err);
      setError(err.message || "Failed to parse Excel file.");
    }
  };

  reader.readAsArrayBuffer(file);
};


  // ---------- Template Download ----------
const downloadTemplate = async () => {
  const fileUrl =
    "https://ycfccvrkbwvyzdkojeag.supabase.co/storage/v1/object/public/jadwa_template/Addition/Addition%20Template.xlsx";

  const response = await fetch(fileUrl);
  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "JADWA Addition.xlsx";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};



  // ---------- Individual photo upload per row ----------
  const handleUploadForMember = async (index: number, file: File) => {
    const m = members[index];
    if (!m?.HRCode) {
      setError("Set HR Code first for this row before uploading photo.");
      return;
    }
    setError("");
    setUploadingFor(m.HRCode);
    const url = await uploadPhotoWithHR(file, m.HRCode);
    setUploadingFor(null);
    if (!url) {
      setError(`⚠️ Failed to upload photo for HR ${m.HRCode}`);
      return;
    }
    const copy = [...members];
    copy[index] = { ...copy[index], photo_url: url };
    setMembers(copy);
  };

  // ---------- Bulk photo upload ----------
  const handleBulkPhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    const copy = [...members];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name.replace(/\.[^/.]+$/, "");
      let idx = copy.findIndex((m) => m.HRCode?.toLowerCase() === name.toLowerCase());
      if (idx === -1) idx = copy.findIndex((m) => name.toLowerCase().startsWith(String(m.HRCode || "").toLowerCase()));
      if (idx === -1) idx = copy.findIndex((m) => String(m.HRCode || "").length > 0 && name.toLowerCase().includes(String(m.HRCode || "").toLowerCase()));
      if (idx === -1) continue;

      const hrToUpload = copy[idx].HRCode;
      setUploadingFor(hrToUpload);
      const url = await uploadPhotoWithHR(file, hrToUpload);
      setUploadingFor(null);
      if (!url) {
        setError((prev) => (prev ? prev + `\nFailed to upload photo for ${hrToUpload}` : `⚠️ Failed to upload photo for ${hrToUpload}`));
        continue;
      }
      copy[idx] = { ...copy[idx], photo_url: url };
    }

    setMembers(copy);
  };

 // ---------- Handele Submit All ----------
  const handleSubmitAll = async () => {
  if (submitting) return;
  setError("");

  if (!user) return setError("Login required.");
  if (members.length === 0) return setError("Add at least one member.");

  setSubmitting(true);

  try {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) throw clientError;

    const membersPayload = members.map((m) => ({
      hr_code: m.HRCode,
      name: m.name,
      nid: m.nid,
      phone: m.phone,
      email: m.email,
      dob: m.dob,
      gender: m.gender,
      nationality: m.nationality,
      addition_date: m.additionDate,
      relation: m.relation,
      principal_number: m.principalNumber,
      plan: m.plan,
      salary: m.salary,
      life_category: m.life_category,
      photo_url: m.photo_url,
    }));

    const { data, error } = await supabase.rpc(
      "submit_addition_request",
      {
        p_client_id: client.id,
        p_request_type: "addition",
        p_members: membersPayload,
      }
    );

    if (error) throw error;

    setRequestRef(data[0].out_request_ref);
    alert(`✅ Request submitted\nRef: ${data[0].out_request_ref}`);

  } catch (err: any) {
    console.error(err);
    setError(err.message || "Submission failed");
  } finally {
    setSubmitting(false);
  }
};

  // ---------- Inline edits / deletes ----------
 const handleSaveEdit = (
  index: number,
  field: keyof Member | string,
  value: any
) => {
  const copy = [...members];

  // 🔒 Always normalize Addition Date
  if (field === "additionDate") {
    value = excelDateToISO(value);
  }

  (copy[index] as any)[field] = value;

  // Auto-derive DOB/Gender from NID
  if (field === "nid" && typeof value === "string" && value.length === 14) {
    const parsed = parseNid(value);
    copy[index].dob = parsed.dob;
    copy[index].gender = parsed.gender;
    copy[index].nationality = parsed.nationality;
  }

  setMembers(copy);
};


  const confirmDelete = (index: number) => setDeleteIndex(index);
  const handleDelete = () => {
    if (deleteIndex === null) return;
    setMembers((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
    if (editIndex !== null && deleteIndex === editIndex) setEditIndex(null);
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">➕ Manage Additions</h1>

        {requestRef && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded">
            ✅ Last submitted Request Number: <strong>{requestRef}</strong> — Status: <strong>Pending</strong>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 whitespace-pre-line bg-red-100 border border-red-400 text-red-600 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView("form")}
            className={`px-4 py-2 rounded-lg font-medium ${view === "form" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Add New Member
          </button>
          <button
            onClick={() => setView("excel")}
            className={`px-4 py-2 rounded-lg font-medium ${view === "excel" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Upload Excel
          </button>
        </div>

        {/* Manual form */}
        {view === "form" && (
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={hrCode} onChange={(e) => setHrCode(e.target.value)} placeholder="HR Code *" className="w-full border rounded-lg px-4 py-2" required />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name *" className="w-full border rounded-lg px-4 py-2" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="NID *" maxLength={14} className="w-full border rounded-lg px-4 py-2" required />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone *" className="w-full border rounded-lg px-4 py-2" required />
              <input type="date" value={additionDate} onChange={(e) => setAdditionDate(e.target.value)}  className="w-full border rounded-lg px-4 py-2" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={relation} onChange={(e) => setRelation(e.target.value)} className="w-full border rounded-lg px-4 py-2" required>
                <option value="">-- Select Relation --</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                  
                ))}
              </select>

              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full border rounded-lg px-4 py-2" required>
                <option value="">-- Select Plan --</option>
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            {/* ✅ added fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full border rounded-lg px-4 py-2" />
              <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary (optional)" className="w-full border rounded-lg px-4 py-2" />
            </div>

            {relation && relation !== "principal" && (
              <div>
                <input value={principalNumber} onChange={(e) => setPrincipalNumber(e.target.value)} placeholder="Principal Number *" className="w-full border rounded-lg px-4 py-2" required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Upload Photo (optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              {photoFile && <div className="text-sm text-gray-600 mt-1">{photoFile.name}</div>}
              {uploadingFor === hrCode && <div className="text-xs text-gray-500 mt-1">Uploading photo...</div>}
            </div>

            <div>
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
                Add Member
              </button>
            </div>
          </form>
        )}

        {/* Excel upload */}
        {view === "excel" && (
          <div className="space-y-4">
            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="w-full border rounded-lg px-4 py-2" />
            <div className="flex gap-2 mt-2 items-center">
              <button onClick={downloadTemplate} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                📥 Download Excel Template
              </button>
              <label className="text-sm text-gray-700">Bulk Photos (select multiple) — filenames should include matching HRCode</label>
            </div>
            <div className="mt-2">
              <input type="file" accept="image/*" multiple onChange={(e) => handleBulkPhotoUpload(e.target.files)} />
              {uploadingFor && <div className="text-xs text-gray-500 mt-1">Uploading for: {uploadingFor}...</div>}
            </div>
            <p className="text-sm text-gray-600">
              If your Excel already contains Photo URLs, the PhotoURL column will be used. Otherwise upload photos using the bulk upload or per-row upload below.
            </p>
          </div>
        )}

        {/* Members preview */}
{members.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-bold mb-4">📋 Members to Submit</h2>

    <div className="overflow-x-auto">
      <table className="min-w-[1600px] border text-sm table-fixed">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-3 py-2 w-24">Actions</th>
            <th className="border px-3 py-2 w-28">HR Code</th>
            <th className="border px-3 py-2 w-80">Name</th>
            <th className="border px-3 py-2 w-40">NID</th>
            <th className="border px-3 py-2 w-36">Phone</th>
            <th className="border px-3 py-2 w-56">Email</th>
            <th className="border px-3 py-2 w-80">DOB</th>
            <th className="border px-3 py-2 w-24">Gender</th>
            <th className="border px-3 py-2 w-28">Relation</th>
            <th className="border px-3 py-2 w-40">Principal</th>
            <th className="border px-3 py-2 w-24">Plan</th>
            <th className="border px-3 py-2 w-28">Addition Date</th>
            <th className="border px-3 py-2 w-24">Salary</th>
            <th className="border px-3 py-2 w-32">Life Category</th>
            <th className="border px-3 py-2 w-24">Photo</th>
          </tr>
        </thead>

        <tbody>
          {members.map((m, i) => (
            <tr
              key={i}
              className={`${editIndex === i ? "bg-blue-50" : ""} ${(!m.HRCode || !m.plan) ? "bg-red-50" : ""}`}
            >
              {/* Actions */}
              <td className="border px-2 py-1 flex justify-center gap-2">
                <button
                  onClick={() => setEditIndex(editIndex === i ? null : i)}
                  className="text-blue-500"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => confirmDelete(i)}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </td>

              {/* HR Code */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    value={m.HRCode}
                    onChange={(e) => handleSaveEdit(i, "HRCode", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.HRCode
                )}
              </td>

              {/* Name */}
              <td className="border px-2 py-1 break-words whitespace-normal">
                {editIndex === i ? (
                  <input
                    value={m.name}
                    onChange={(e) => handleSaveEdit(i, "name", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.name
                )}
              </td>

              {/* NID */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    value={m.nid}
                    maxLength={14}
                    onChange={(e) => handleSaveEdit(i, "nid", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.nid
                )}
              </td>

              {/* Phone */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    value={m.phone}
                    onChange={(e) => handleSaveEdit(i, "phone", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.phone
                )}
              </td>

              {/* Email */}
              <td className="border px-2 py-1 break-words whitespace-normal">
                {editIndex === i ? (
                  <input
                    value={m.email || ""}
                    onChange={(e) => handleSaveEdit(i, "email", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.email || "—"
                )}
              </td>

              {/* DOB (read-only) */}
              <td className="border px-2 py-1">{m.dob || "—"}</td>

              {/* Gender (read-only) */}
              <td className="border px-2 py-1">{m.gender || "—"}</td>

              {/* Relation */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <select
                    value={m.relation || ""}
                    onChange={(e) => handleSaveEdit(i, "relation", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">--</option>
                    {RELATIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  m.relation || "—"
                )}
              </td>

              {/* Principal */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    value={m.principalNumber || ""}
                    onChange={(e) => handleSaveEdit(i, "principalNumber", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.principalNumber || "—"
                )}
              </td>

              {/* Plan */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <select
                    value={m.plan || ""}
                    onChange={(e) => handleSaveEdit(i, "plan", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">--</option>
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  m.plan || "—"
                )}
              </td>

              {/* Addition Date */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    type="date"
                    value={m.additionDate || ""}
                    onChange={(e) => handleSaveEdit(i, "additionDate", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.additionDate || "—"
                )}
              </td>

              {/* Salary */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    value={m.salary ?? ""}
                    onChange={(e) =>
                      handleSaveEdit(
                        i,
                        "salary",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.salary ?? "—"
                )}
              </td>

              {/* Life Category */}
              <td className="border px-2 py-1">
                {editIndex === i ? (
                  <input
                    value={m.life_category ?? ""}
                    onChange={(e) => handleSaveEdit(i, "life_category", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                ) : (
                  m.life_category ?? "—"
                )}
              </td>

              {/* Photo */}
              <td className="border px-2 py-1">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt="photo"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(ev) =>
                      ev.target.files?.[0] &&
                      handleUploadForMember(i, ev.target.files[0])
                    }
                  />
                )}
                {uploadingFor === m.HRCode && (
                  <div className="text-xs text-gray-500">Uploading...</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-4 flex justify-end gap-3">
      <button
        onClick={() => {
          setMembers([]);
          setRequestRef(null);
        }}
        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
      >
        Clear
      </button>

      <button
        onClick={handleSubmitAll}
        disabled={submitting}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        {submitting ? "Submitting..." : "🚀 Submit Request"}
      </button>
    </div>
  </div>
)}


        {/* Confirm delete modal */}
        {deleteIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg font-bold mb-4 text-red-600">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete member <strong>{members[deleteIndex]?.name}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setDeleteIndex(null)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
