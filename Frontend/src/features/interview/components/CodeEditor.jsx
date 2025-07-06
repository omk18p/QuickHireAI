import { useState } from "react";
import "../styles/CodeEditor.css";

const CodeEditor = ({ onCodeChange }) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>
      <textarea
        value={code}
        onChange={handleCodeChange}
        placeholder="Write your code here..."
        className="code-textarea"
        spellCheck="false"
      />
    </div>
  );
};

export default CodeEditor; 