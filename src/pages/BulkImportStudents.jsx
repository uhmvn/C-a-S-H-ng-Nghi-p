import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";

function BulkImportStudentsContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [importResults, setImportResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(console.error);
  }, []);

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
    initialData: []
  });

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        row._rowIndex = index + 2; // +2 for header and 1-based index
        return row;
      });
      
      setParsedData(data);
      toast.success(`Đã đọc ${data.length} bản ghi từ CSV`);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async (data) => {
      const results = [];
      
      for (const row of data) {
        try {
          const cls = classes.find(c => 
            c.class_code === row.class_code || c.name === row.class_name
          );

          if (!cls) {
            results.push({ 
              row: row._rowIndex, 
              status: 'error', 
              message: `Không tìm thấy lớp ${row.class_code || row.class_name}` 
            });
            continue;
          }

          // Generate code
          const userCode = `HS-${row.school_code || 'LAN'}-${row.year || '2025'}-${cls.class_code}-${row.sequence.padStart(3, '0')}`;
          const secretCode = Math.random().toString(36).substring(2, 10);

          await base44.entities.UserProfile.create({
            user_id: `student_${Date.now()}_${row._rowIndex}`,
            user_code: userCode,
            secret_code: secretCode,
            role: 'student',
            status: 'pending',
            class_id: cls.id,
            class_name: cls.name,
            grade_level: cls.grade_id,
            school_name: row.school_code || 'LAN',
            parent_phone: row.parent_phone || null,
            code_issued_by: currentUser?.id,
            code_issued_at: new Date().toISOString()
          });

          results.push({ 
            row: row._rowIndex, 
            status: 'success', 
            userCode, 
            secretCode 
          });
        } catch (error) {
          results.push({ 
            row: row._rowIndex, 
            status: 'error', 
            message: error.message 
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast.success(`Import thành công ${successCount} học sinh, lỗi ${errorCount}`);
      
      // Download results CSV
      const csv = [
        'Row,Status,User Code,Secret Code,Message',
        ...results.map(r => `${r.row},${r.status},${r.userCode || ''},${r.secretCode || ''},${r.message || ''}`)
      ].join('\n');
      
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `import_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error) => {
      toast.error(`Lỗi import: ${error.message}`);
    }
  });

  const downloadTemplate = () => {
    const template = `role,school_code,class_code,class_name,year,sequence,parent_phone
student,LAN,10A,Lớp 10A,2025,1,0123456789
student,LAN,10A,Lớp 10A,2025,2,0987654321`;

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_students_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Đã tải template CSV');
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Học Sinh Hàng Loạt</h1>
          <p className="text-gray-600">Upload file CSV để tạo nhiều học sinh cùng lúc</p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold text-xl">1</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Tải template</h3>
            <p className="text-sm text-gray-600 mb-4">Download file CSV mẫu</p>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50"
            >
              <Download className="w-4 h-4" />
              Tải template
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-green-600 font-bold text-xl">2</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Upload CSV</h3>
            <p className="text-sm text-gray-600 mb-4">Chọn file đã điền</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setCsvFile(file);
                  parseCSV(file);
                }
              }}
              className="w-full text-sm"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-purple-600 font-bold text-xl">3</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Import</h3>
            <p className="text-sm text-gray-600 mb-4">Xác nhận và import</p>
            <button
              onClick={() => importMutation.mutate(parsedData)}
              disabled={parsedData.length === 0 || importMutation.isLoading}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {importMutation.isLoading ? 'Đang import...' : 'Import ngay'}
            </button>
          </div>
        </div>

        {/* Preview Data */}
        {parsedData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Xem trước ({parsedData.length} bản ghi)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Dòng</th>
                    <th className="px-4 py-2 text-left">Lớp</th>
                    <th className="px-4 py-2 text-left">STT</th>
                    <th className="px-4 py-2 text-left">SĐT PH</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{row._rowIndex}</td>
                      <td className="px-4 py-2">{row.class_code}</td>
                      <td className="px-4 py-2">{row.sequence}</td>
                      <td className="px-4 py-2">{row.parent_phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  ... và {parsedData.length - 10} bản ghi khác
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kết quả import</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {importResults.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Dòng {result.row}: {result.status === 'success' ? result.userCode : result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function BulkImportStudents() {
  return (
    <ToastProvider>
      <BulkImportStudentsContent />
    </ToastProvider>
  );
}