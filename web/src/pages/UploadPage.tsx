import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCuration } from '@/context/useCuration'

export function UploadPage() {
  const navigate = useNavigate()
  const { ingestJsonText } = useCuration()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const finishIngest = useCallback(
    (text: string, name: string) => {
      try {
        ingestJsonText(text, name)
        setProgress(100)
        setTimeout(() => {
          setBusy(false)
          setFileName(null)
          navigate('/explorer')
        }, 400)
      } catch (e) {
        setBusy(false)
        setErr(e instanceof Error ? e.message : 'Failed to parse export.')
      }
    },
    [ingestJsonText, navigate],
  )

  const handleFile = useCallback(
    async (file: File) => {
      setErr(null)
      if (!file.name.toLowerCase().endsWith('.json')) {
        setErr('Please choose a .json export file.')
        return
      }
      setBusy(true)
      setFileName(file.name)
      setProgress(10)
      try {
        const text = await file.text()
        setProgress(60)
        finishIngest(text, file.name)
      } catch {
        setBusy(false)
        setErr('Could not read file.')
      }
    },
    [finishIngest],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) void handleFile(f)
    },
    [handleFile],
  )

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-surface">
      <div className="p-6 md:p-12 lg:p-24 flex flex-col items-center flex-1">
        <div className="w-full max-w-2xl text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-4">
            Data Ingestion
          </h2>
          <p className="text-on-surface-variant font-body text-base md:text-lg max-w-xl mx-auto">
            Upload JSON datasets for editorial analysis. This build supports the
            harvest export shape (root object with a{' '}
            <code className="text-sm bg-surface-container-high px-1.5 py-0.5 rounded">
              posts
            </code>{' '}
            array).
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full max-w-2xl bg-surface-container-lowest rounded-xl p-10 md:p-12 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(5,52,92,0.06)] relative overflow-hidden cursor-pointer border transition-colors duration-300 ${
            dragOver
              ? 'border-primary/50 bg-primary/5'
              : 'border-outline-variant/15 hover:border-primary/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#324be5 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-8 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-primary opacity-80">
              upload_file
            </span>
          </div>
          <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">
            Drag and drop your JSON file here
          </h3>
          <p className="text-on-surface-variant text-sm font-body mb-8">
            or click to browse your local directory
          </p>
          <button
            type="button"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-body text-sm font-medium px-8 py-3 rounded-full shadow-[0_8px_24px_rgba(50,75,229,0.2)] hover:shadow-[0_12px_32px_rgba(50,75,229,0.28)] transition-all active:scale-95 flex items-center gap-2 pointer-events-none"
          >
            <span className="material-symbols-outlined text-sm">folder_open</span>
            Select File
          </button>
          <div className="mt-8 pt-8 border-t border-surface-container-high w-full flex flex-col items-center">
            <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-4">
              Supported formats
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <span className="bg-surface-container-high text-on-surface-variant text-xs font-medium px-3 py-1 rounded-full">
                .json
              </span>
            </div>
          </div>
        </div>

        {err ? (
          <p className="mt-6 text-sm text-error font-medium max-w-xl text-center">
            {err}
          </p>
        ) : null}

        {busy && fileName ? (
          <div className="w-full max-w-2xl mt-8 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(5,52,92,0.06)] border border-outline-variant/15 flex items-center gap-6">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary animate-spin">
                progress_activity
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-2 gap-2">
                <h4 className="text-sm font-headline font-semibold text-on-surface truncate">
                  {fileName}
                </h4>
                <span className="text-xs font-medium text-primary shrink-0">
                  Parsing… {progress}%
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary-container h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
