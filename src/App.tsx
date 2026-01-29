import { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import * as XLSX from 'xlsx';
import { Download, Trash2, Moon, Sun, GripVertical, X } from 'lucide-react';

interface DataField {
  key: string;
  label: string;
  enabled: boolean;
}

interface UserData {
  [key: string]: string;
}

interface Template {
  name: string;
  fields: string[];
}

const templates: Template[] = [
  { name: 'Basic Contacts', fields: ['firstName', 'lastName', 'email', 'phoneNumber'] },
  { name: 'Employee Directory', fields: ['firstName', 'lastName', 'email', 'jobTitle', 'company'] },
  { name: 'Survey Participants', fields: ['firstName', 'lastName', 'email', 'gender', 'country'] },
  { name: 'Full Profile', fields: ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'city', 'state', 'zipCode', 'country', 'gender', 'jobTitle', 'company', 'dateOfBirth'] },
];

function App() {
  const [recordCount, setRecordCount] = useState<string>('');
  const [userData, setUserData] = useState<UserData[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [customDomain, setCustomDomain] = useState<string>('');
  const [domainError, setDomainError] = useState<string>('');

  /* Here were stating declaration wheere the setExportHistroy function is used to update our list whenever a new file is downloaded */

  const [exportHistory, setExportHistory] = useState<any[]>([]);
  
  const [fields, setFields] = useState<DataField[]>([
    { key: 'firstName', label: 'First Name', enabled: true },
    { key: 'lastName', label: 'Last Name', enabled: true },
    { key: 'email', label: 'Email', enabled: true },
    { key: 'phoneNumber', label: 'Phone Number', enabled: true },
    { key: 'address', label: 'Address', enabled: false },
    { key: 'city', label: 'City', enabled: false },
    { key: 'state', label: 'State', enabled: false },
    { key: 'zipCode', label: 'ZIP Code', enabled: false },
    { key: 'country', label: 'Country', enabled: false },
    { key: 'gender', label: 'Gender', enabled: false },
    { key: 'jobTitle', label: 'Job Title', enabled: false },
    { key: 'company', label: 'Company', enabled: false },
    { key: 'dateOfBirth', label: 'Date of Birth', enabled: false },
  ]);

  /* This function will add the new downloaded files to the top of the histroy list. 
  It will store our file name, URL, and timestamp, while only keeeping the top three 
  most recent exports, and save them to local storage so the list will stay avalable while 
  refreshing the page. */
  
  const saveToExportHistory = (fileName: string, fileUrl: string) => {
    const newEntry = {
      name: fileName,
      url: fileUrl,
      time: new Date().toLocaleString(),
    };

    setExportHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 3);
      localStorage.setItem('exportHistory', JSON.stringify(updated));
      return updated;
    });
  };

  /* This useEffect runs when our website loads. Its job is to recieve any previous saved export
  history from local storage and restores it into exportHistory so the users can still see thier
  laast three exports after refreshing the page. */
  
  useEffect(() => {
    const stored = localStorage.getItem('exportHistory');
    if (stored) setExportHistory(JSON.parse(stored));
  }, []);

  const formatPhoneNumber = (phone: string): string => {
    const middleThree = Math.floor(100 + Math.random() * 900);
    const lastFour = Math.floor(1000 + Math.random() * 9000);
    return `555-${middleThree}-${lastFour}`;
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain) return true;
    const domainRegex = /^@[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  const handleDomainChange = (value: string) => {
    setCustomDomain(value);
    if (value && !validateDomain(value)) {
      setDomainError('Please enter a valid domain (e.g., @example.com)');
    } else {
      setDomainError('');
    }
  };

  const generateFieldValue = (key: string): string => {
    switch (key) {
      case 'firstName': return faker.person.firstName();
      case 'lastName': return faker.person.lastName();
      case 'email': {
        const firstName = faker.person.firstName().toLowerCase();
        const lastName = faker.person.lastName().toLowerCase();
        let domain: string;

        if (customDomain && validateDomain(customDomain)) {
          domain = customDomain.substring(1);
        } else {
          const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
          domain = domains[Math.floor(Math.random() * domains.length)];
        }

        return `${firstName}.${lastName}.test@${domain}`;
      }
      case 'phoneNumber': return formatPhoneNumber(faker.phone.number());
      case 'address': return faker.location.streetAddress();
      case 'city': return faker.location.city();
      case 'state': return faker.location.state();
      case 'zipCode': return faker.location.zipCode();
      case 'country': return faker.location.country();
      case 'gender': return faker.person.sex();
      case 'jobTitle': return faker.person.jobTitle();
      case 'company': return faker.company.name();
      case 'dateOfBirth': return faker.date.birthdate().toISOString().split('T')[0];
      default: return faker.lorem.word();
    }
  };

  const generateData = () => {
    const count = parseInt(recordCount) || 0;
    if (count <= 0 || count > 10000) {
      alert('Please enter a number between 1 and 10,000');
      return;
    }

    const enabledFields = fields.filter(f => f.enabled);
    if (enabledFields.length === 0) {
      alert('Please select at least one field to generate data');
      return;
    }

    const data: UserData[] = [];
    for (let i = 0; i < count; i++) {
      const record: UserData = {};
      enabledFields.forEach(field => {
        record[field.key] = generateFieldValue(field.key);
      });
      data.push(record);
    }
    setUserData(data);
  };

  const downloadExcel = () => {
    if (userData.length === 0) {
      alert('No data to download. Please generate data first.');
      return;
    }

    const enabledFields = fields.filter(f => f.enabled);
    const worksheet = XLSX.utils.json_to_sheet(
      userData.map(user => {
        const row: { [key: string]: string } = {};
        enabledFields.forEach(field => {
          row[field.label] = user[field.key] || '';
        });
        return row;
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Data');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `breakthrough_t1d_data_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);


    /* Once an Excel file is created this will generate a temporary download link and will call saveToExportHistory to record the file name, link, and time while updating our history with the newest download*/
    
    const blob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileUrl = URL.createObjectURL(new Blob([blob]));
    saveToExportHistory(fileName, fileUrl);
    

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const downloadCSV = () => {
    if (userData.length === 0) {
      alert('No data to download. Please generate data first.');
      return;
    }

    const enabledFields = fields.filter(f => f.enabled);
    const headers = enabledFields.map(f => f.label);
    const csvContent = [
      headers.join(','),
      ...userData.map(user =>
        enabledFields.map(field => `"${user[field.key] || ''}"`).join(',')
      ),
    ].join('\n');


    /* This function creates a downloadable link for a generated CSV file, then 
    it calls to saveToExportHistory to log the file names, link, and time stamp.*/
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `breakthrough_t1d_data_${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    saveToExportHistory(fileName, url);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const clearTable = () => setUserData([]);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleField = (key: string) =>
    setFields(fields.map(f => (f.key === key ? { ...f, enabled: !f.enabled } : f)));

  const applyTemplate = (template: Template) =>
    setFields(fields.map(f => ({ ...f, enabled: template.fields.includes(f.key) })));

  const openCustomizeModal = (template: Template) => {
    setSelectedTemplate(template);
    setShowCustomizeModal(true);
  };

  const applyCustomTemplate = () => {
    if (!selectedTemplate) return;

    const templateFieldKeys = selectedTemplate.fields;
    const orderedFields = [...fields];
    const enabledTemplateFields = orderedFields.filter(f => templateFieldKeys.includes(f.key));
    const otherFields = orderedFields.filter(f => !templateFieldKeys.includes(f.key));

    const reorderedFields = [
      ...enabledTemplateFields.map(f => ({ ...f, enabled: true })),
      ...otherFields.map(f => ({ ...f, enabled: false }))
    ];

    setFields(reorderedFields);
    setShowCustomizeModal(false);
    setSelectedTemplate(null);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (!selectedTemplate) return;

    const templateFieldKeys = selectedTemplate.fields;
    const templateFields = fields.filter(f => templateFieldKeys.includes(f.key));

    const newOrder = [...templateFields];
    const [movedField] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedField);

    const otherFields = fields.filter(f => !templateFieldKeys.includes(f.key));
    const updatedFields = [...newOrder, ...otherFields];

    setFields(updatedFields);
  };

  const moveEnabledField = (fromIndex: number, toIndex: number) => {
    const enabledFields = fields.filter(f => f.enabled);
    const disabledFields = fields.filter(f => !f.enabled);

    const newOrder = [...enabledFields];
    const [movedField] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedField);

    setFields([...newOrder, ...disabledFields]);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveField(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleColumnDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveEnabledField(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleColumnDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-[#F7F7F7]'}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-4xl font-extrabold mb-2 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-[#0B1157]'
            }`}>
              Random Data Generator
            </h1>
            <p className={`transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-[#0B1157]'
            }`}>
              Generate realistic test data for your applications
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
              darkMode
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600'
                : 'bg-white text-[#0B1157] hover:bg-gray-50'
            }`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <div className={`rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-semibold transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-[#0B1157]'
              }`}>
                Quick Templates
              </label>
              <span className={`text-xs px-3 py-1 rounded-full ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-blue-600'
              }`}>
                Click ⚙️ to customize field order
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {templates.map(template => (
                <div key={template.name} className="flex gap-1">
                  <button
                    onClick={() => applyTemplate(template)}
                    className={`px-4 py-2 rounded-full font-medium shadow transition-all duration-300 hover:scale-105 ${
                      darkMode
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-100 text-[#0B1157] hover:bg-gray-200'
                    }`}
                  >
                    {template.name}
                  </button>
                  <button
                    onClick={() => openCustomizeModal(template)}
                    className={`px-3 py-2 rounded-full font-medium shadow transition-all duration-300 hover:scale-105 flex items-center gap-1 ${
                      darkMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title="Customize field order"
                  >
                    <span className="text-sm">⚙️</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-[#0B1157]'
            }`}>
              Select Fields
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fields.map(field => (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={() => toggleField(field.key)}
                      className="w-4 h-4 rounded border-gray-300 text-[#002bff] focus:ring-[#002bff]"
                    />
                    <span className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-[#0B1157]'
                    }`}>
                      {field.label}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {fields.filter(f => f.enabled).length > 0 && (
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-[#0B1157]'
              }`}>
                Column Order (Drag to Reorder)
              </label>
              <div className={`flex flex-wrap gap-2 p-4 rounded-full border-2 border-dashed transition-all duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
              }`}>
                {fields.filter(f => f.enabled).map((field, index) => (
                  <div
                    key={field.key}
                    draggable
                    onDragStart={() => handleColumnDragStart(index)}
                    onDragOver={(e) => handleColumnDragOver(e, index)}
                    onDragEnd={handleColumnDragEnd}
                    className={`px-4 py-2 rounded-full font-medium cursor-move shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 ${
                      draggedIndex === index
                        ? darkMode
                          ? 'bg-[#002bff] text-white'
                          : 'bg-[#002bff] text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-200'
                        : 'bg-white text-[#0B1157] border border-gray-200'
                    }`}
                  >
                    {field.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-[#0B1157]'
            }`}>
              Custom Domain (optional)
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              placeholder="@example.com"
              className={`w-full px-4 py-3 border rounded-full focus:ring-2 focus:ring-[#002bff] focus:outline-none transition-all duration-300 ${
                domainError
                  ? 'border-red-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-[#0B1157]'
              }`}
            />
            {domainError && (
              <p className="text-red-500 text-xs mt-1">{domainError}</p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-[#0B1157]'
              }`}>
                Number of Records
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={recordCount}
                onChange={(e) => setRecordCount(e.target.value)}
                placeholder="Enter count (max 10,000)"
                className={`w-full px-4 py-3 border rounded-full focus:ring-2 focus:ring-[#002bff] focus:outline-none transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-[#0B1157]'
                }`}
              />
            </div>
            <div className="flex flex-col items-end">
              <button
                onClick={generateData}
                className="w-full md:w-auto px-8 py-3 bg-[#002bff] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-[#0020cc]"
              >
                Generate Data
              </button>
              {customDomain && validateDomain(customDomain) && (
                <span className={`text-xs mt-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Using domain: {customDomain}
                </span>
              )}
            </div>
          </div>

          {userData.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={downloadExcel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#008D28] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-[#007020]"
              >
                <Download size={20} />
                Download as Excel
              </button>
              <button
                onClick={downloadCSV}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#008D28] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-[#007020]"
              >
                <Download size={20} />
                Download as CSV
              </button>
            </div>
          )}
        </div>

        {userData.length > 0 && (
          <div className={`rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-[#0B1157]'
              }`}>
                Generated Data ({userData.length} records)
              </h2>
              <button
                onClick={clearTable}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <Trash2 size={18} />
                Clear Table
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className={darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-[#002bff] to-[#0040ff]'}>
                    {fields.filter(f => f.enabled).map(field => (
                      <th
                        key={field.key}
                        className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider"
                      >
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userData.slice(0, 100).map((user, idx) => (
                    <tr
                      key={idx}
                      className={`transition-colors duration-200 ${
                        darkMode
                          ? 'border-b border-gray-700 hover:bg-gray-700'
                          : idx % 2 === 0
                          ? 'bg-gray-50 hover:bg-gray-100'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {fields.filter(f => f.enabled).map(field => (
                        <td
                          key={field.key}
                          className={`px-6 py-4 text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-[#0B1157]'
                          }`}
                        >
                          {user[field.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {userData.length > 100 && (
              <p className={`text-sm mt-4 transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Showing first 100 of {userData.length} records. Download to view all.
              </p>
            )}
          </div>
        )}

        {/* This section will display the export history list on the webpage. It will also show a Re-downlaod link so we 
        can get quick access to our previous files*/}
        
        <div className={`rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-[#0B1157]'}`}>📜 Export History</h2>

          {exportHistory.length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No recent exports yet.</p>
          ) : (
            <ul className="space-y-2">
              {exportHistory.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <div>
                    <p>{item.name}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <a
                    href={item.url}
                    download={item.name}
                    className="text-blue-500 hover:underline"
                  >
                    Re-download
                  </a>
                </li>
              ))}
            </ul>
          )}


          {/* This button will clear the export history upon users request. */}
          {exportHistory.length > 0 && (
            <button
              onClick={() => {
                setExportHistory([]);
                localStorage.removeItem('exportHistory');
              }}
              className="mt-3 text-sm text-red-500 hover:underline"
            >
              Clear History
            </button>
      
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-8 right-8 bg-[#008D28] text-white px-6 py-4 rounded-full shadow-2xl animate-slideIn">
          <p className="font-semibold">File downloaded successfully!</p>
        </div>
      )}

      {showCustomizeModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-[#0B1157]'
              }`}>
                Customize {selectedTemplate.name}
              </h2>
              <button
                onClick={() => {
                  setShowCustomizeModal(false);
                  setSelectedTemplate(null);
                }}
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X size={24} className={darkMode ? 'text-gray-300' : 'text-[#0B1157]'} />
              </button>
            </div>

            <p className={`text-sm mb-4 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Drag and drop to reorder fields. The order you set here will be the column order in your exported data.
            </p>

            <div className="space-y-2 mb-6">
              {fields
                .filter(f => selectedTemplate.fields.includes(f.key))
                .map((field, index) => (
                  <div
                    key={field.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-move transition-all ${
                      draggedIndex === index
                        ? 'opacity-50 scale-95'
                        : 'opacity-100 scale-100'
                    } ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <GripVertical size={20} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
                    <span className={`font-medium ${
                      darkMode ? 'text-gray-200' : 'text-[#0B1157]'
                    }`}>
                      {field.label}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomizeModal(false);
                  setSelectedTemplate(null);
                }}
                className={`flex-1 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-[#0B1157] hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={applyCustomTemplate}
                className="flex-1 px-6 py-3 bg-[#002bff] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-[#0020cc]"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;