import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove } from 'firebase/database';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Upload, Trash2, Code, Users, Download, FileText } from 'lucide-react';

// Firebase configuration - Replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyCSPd1yGh7u-on7bCyAF2UBmD7F6RjregE",
  authDomain: "code-class-d2b5a.firebaseapp.com",
  databaseURL: "https://code-class-d2b5a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "code-class-d2b5a",
  storageBucket: "code-class-d2b5a.firebasestorage.app",
  messagingSenderId: "551387813854",
  appId: "1:551387813854:web:609937ec13ffbd55286f4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  const [view, setView] = useState('home');
  const [sessionCode, setSessionCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [studentName, setStudentName] = useState('');

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createTeacherSession = () => {
    const code = generateCode();
    const sessionRef = ref(database, `sessions/${code}`);
    set(sessionRef, {
      code,
      isTeacher: true,
      currentCode: '',
      currentFileName: 'Untitled.cs',
      currentTitle: '',
      currentDescription: '',
      students: {},
      codeSnippets: {},
      createdAt: Date.now()
    });
    setSessionCode(code);
    setView('teacher');
  };

  const joinStudentSession = () => {
    if (!studentName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    const sessionRef = ref(database, `sessions/${inputCode}`);
    onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const studentId = `student_${Date.now()}`;
        const studentRef = ref(database, `sessions/${inputCode}/students/${studentId}`);
        set(studentRef, {
          name: studentName,
          joinedAt: Date.now()
        });
        setSessionCode(inputCode);
        setView('student');
      } else {
        alert('Invalid session code');
      }
    }, { onlyOnce: true });
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Code className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Code Classroom</h1>
            <p className="text-gray-600 mt-2">Share code with your students in real-time</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={createTeacherSession}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-lg transition duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <Code className="w-5 h-5" />
              Create Teacher Session
            </button>
            
            <div className="border-t pt-4">
              <p className="text-gray-600 text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Join as Student
              </p>
              <input
                type="text"
                placeholder="Your Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <input
                type="text"
                placeholder="Session Code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                onClick={joinStudentSession}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition duration-200"
              >
                Join Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'teacher') {
    return <TeacherView sessionCode={sessionCode} />;
  }

  if (view === 'student') {
    return <StudentView sessionCode={sessionCode} studentName={studentName} />;
  }
}

function TeacherView({ sessionCode }) {
  const [currentCode, setCurrentCode] = useState('');
  const [fileName, setFileName] = useState('Untitled.cs');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [students, setStudents] = useState({});
  const [savedSnippets, setSavedSnippets] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${sessionCode}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setStudents(data.students || {});
        setSavedSnippets(data.codeSnippets || {});
      }
    });

    return () => unsubscribe();
  }, [sessionCode]);

  const updateCode = () => {
    const sessionRef = ref(database, `sessions/${sessionCode}`);
    set(sessionRef, {
      code: sessionCode,
      isTeacher: true,
      currentCode,
      currentFileName: fileName,
      currentTitle: title,
      currentDescription: description,
      students,
      codeSnippets: savedSnippets,
      updatedAt: Date.now()
    });
  };

  const saveSnippet = () => {
    if (!currentCode.trim()) {
      alert('Please write some code first');
      return;
    }
    
    const snippetsRef = ref(database, `sessions/${sessionCode}/codeSnippets`);
    const newSnippetRef = push(snippetsRef);
    set(newSnippetRef, {
      code: currentCode,
      fileName,
      title: title || 'Untitled',
      description: description || '',
      createdAt: Date.now()
    });
  };

  const loadSnippet = (snippetId, snippet) => {
    setCurrentCode(snippet.code);
    setFileName(snippet.fileName);
    setTitle(snippet.title || '');
    setDescription(snippet.description || '');
  };

  const deleteSnippet = (snippetId) => {
    const snippetRef = ref(database, `sessions/${sessionCode}/codeSnippets/${snippetId}`);
    remove(snippetRef);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentCode(e.target.result);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

 const parseImportFile = (content) => {
  // TITLE: Your title here
  // DESC: Your description here
  // CODE:
  // your code here
  // ENDCODE
  
  let parsedTitle = '';
  let parsedDescription = '';
  let parsedCode = '';
  
  // Extract title (TITLE: ...)
  const titleMatch = content.match(/TITLE:\s*(.+)/i);
  if (titleMatch) {
    parsedTitle = titleMatch[1].trim();
  }
  
  // Extract description (DESC: ...)
  const descMatch = content.match(/DESC:\s*(.+)/i);
  if (descMatch) {
    parsedDescription = descMatch[1].trim();
  }
  
  // Extract code between CODE: and ENDCODE
  const codeMatch = content.match(/CODE:\s*([\s\S]*?)\s*ENDCODE/i);
  if (codeMatch) {
    parsedCode = codeMatch[1].trim();
  }
  
  return { parsedTitle, parsedDescription, parsedCode };
};
const parseMultipleSnippets = (content) => {
  const snippets = [];
  
  // Find all CODE: ... ENDCODE blocks
  const regex = /TITLE:\s*(.+?)[\r\n]+DESC:\s*(.+?)[\r\n]+CODE:\s*([\s\S]*?)ENDCODE/gi;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    snippets.push({
      title: match[1].trim(),
      description: match[2].trim(),
      code: match[3].trim()
    });
  }
  
  // If no matches with full format, try just CODE: ... ENDCODE
  if (snippets.length === 0) {
    const simpleRegex = /CODE:\s*([\s\S]*?)ENDCODE/gi;
    while ((match = simpleRegex.exec(content)) !== null) {
      snippets.push({
        title: '',
        description: '',
        code: match[1].trim()
      });
    }
  }
  
  return snippets;
};
  const importSnippet = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const snippets = parseMultipleSnippets(content);
        
        if (snippets.length === 0) {
          alert('No code found in file. Make sure code is between CODE: and ENDCODE');
          return;
        }
        
        if (snippets.length === 1) {
          // Single snippet - load directly
          setTitle(snippets[0].title);
          setDescription(snippets[0].description);
          setCurrentCode(snippets[0].code);
        } else {
          // Multiple snippets - save all and load first one
          snippets.forEach((snippet, index) => {
            const snippetsRef = ref(database, `sessions/${sessionCode}/codeSnippets`);
            const newSnippetRef = push(snippetsRef);
            set(newSnippetRef, {
              code: snippet.code,
              fileName: `Imported_${index + 1}.cs`,
              title: snippet.title || `Imported Snippet ${index + 1}`,
              description: snippet.description || '',
              createdAt: Date.now()
            });
          });
          
          // Load first one
          setTitle(snippets[0].title);
          setDescription(snippets[0].description);
          setCurrentCode(snippets[0].code);
          
          alert(`Imported ${snippets.length} snippets! Check "Saved Snippets" to load the others.`);
        }
        
        setFileName(file.name.replace('.txt', '.cs'));
        
      } catch (error) {
        alert('Error reading file. Please check the format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  }
};

  const exportSnippet = (snippet) => {
  let exportContent = '';
  
  if (snippet.title) {
    exportContent += `TITLE: ${snippet.title}\n\n`;
  }
  
  if (snippet.description) {
    exportContent += `DESC: ${snippet.description}\n\n`;
  }
  
  exportContent += `CODE:\n${snippet.code}\nENDCODE`;
  
  const blob = new Blob([exportContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${snippet.fileName || 'snippet'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

  const downloadCode = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Teacher Panel</h2>
              <p className="text-sm text-gray-600">Session Code: <span className="font-mono font-bold text-indigo-600 text-lg">{sessionCode}</span></p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Connected Students</p>
                <p className="text-2xl font-bold text-indigo-600">{Object.keys(students).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Title and Description */}
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Code Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  rows="2"
                />
              </div>

              {/* File Name and Actions */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  placeholder="File name (e.g., Program.cs)"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept=".cs,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Import
                  <input
                    type="file"
                    accept=".txt"
                    onChange={importSnippet}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={downloadCode}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* Code Editor */}
              <textarea
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                className="w-full h-96 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                placeholder="Write or paste your C# code here..."
              />

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={updateCode}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200"
                >
                  Push to Students
                </button>
                <button
                  onClick={saveSnippet}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
                >
                  Save Snippet
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
                >
                  {showPreview ? 'Hide' : 'Preview'}
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold mb-2">Code Preview</h3>
                {title && <h4 className="text-md font-semibold text-gray-700 mb-1">{title}</h4>}
                {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
                <div className="rounded-lg overflow-hidden">
                  <SyntaxHighlighter
                    language="csharp"
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                  >
                    {currentCode || '// No code to preview'}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connected Students */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students ({Object.keys(students).length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(students).map(([id, student]) => (
                  <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{student.name}</span>
                  </div>
                ))}
                {Object.keys(students).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No students connected</p>
                )}
              </div>
            </div>

            {/* Saved Snippets */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Saved Snippets</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(savedSnippets).map(([id, snippet]) => (
                  <div key={id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">{snippet.title || 'Untitled'}</p>
                        <p className="font-mono text-xs text-gray-600">{snippet.fileName}</p>
                        {snippet.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{snippet.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(snippet.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteSnippet(id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSnippet(id, snippet)}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm py-1 rounded transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => exportSnippet(snippet)}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm py-1 rounded transition"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(savedSnippets).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No saved snippets</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentView({ sessionCode, studentName }) {
  const [currentCode, setCurrentCode] = useState('');
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${sessionCode}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentCode(data.currentCode || '');
        setFileName(data.currentFileName || 'Untitled.cs');
        setTitle(data.currentTitle || '');
        setDescription(data.currentDescription || '');
        setStudentCount(Object.keys(data.students || {}).length);
      }
    });

    return () => unsubscribe();
  }, [sessionCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy code');
    }
  };

  const downloadCode = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-90">Welcome, {studentName}</p>
              <p className="text-xs opacity-75">Session: {sessionCode}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">{studentCount} students online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-white font-mono text-sm ml-4">{fileName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={downloadCode}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <div className="p-6">
            {currentCode ? (
              <div>
                {/* Title and Description */}
                {(title || description) && (
                  <div className="mb-4 pb-4 border-b">
                    {title && <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>}
                    {description && <p className="text-gray-600">{description}</p>}
                  </div>
                )}
                
                {/* Code Display */}
                <div className="rounded-lg overflow-hidden">
                  <SyntaxHighlighter
                    language="csharp"
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{ margin: 0, fontSize: '14px' }}
                    wrapLongLines
                  >
                    {currentCode}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Code className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-600">Waiting for teacher to share code...</p>
                <p className="text-sm text-gray-500 mt-2">Code will appear here when your teacher pushes it</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;