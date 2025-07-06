import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import "../styles/SimpleCodeEditor.css";

const SimpleCodeEditor = ({ onCodeChange, language = "javascript", initialValue = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEditorChange = (value) => {
    if (onCodeChange) {
      onCodeChange(value || '');
    }
  };

  const handleEditorDidMount = (editor) => {
    editor.updateOptions({
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: "on",
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3
    });
  };

  return (
    <div className={`simple-editor-container ${isExpanded ? "expanded" : ""}`}>
      <div className="editor-header">
        <div className="editor-controls">
          <span className="language-label">{language}</span>
          <button 
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse editor" : "Expand editor"}
          >
            {isExpanded ? "⟨" : "⟩"}
          </button>
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height={isExpanded ? "400px" : "180px"}
          defaultLanguage={language}
          defaultValue={initialValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            wordWrap: "on",
            padding: { top: 8, bottom: 8 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false
          }}
          loading={<div className="editor-loading">Loading editor...</div>}
        />
      </div>
    </div>
  );
};

export default SimpleCodeEditor; 