import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import "katex/dist/katex.min.css";
import { CopyButton } from "@/components/chat/CopyButton";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose max-w-3xl prose-sm">
      <div className="relative group">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code(props: any) {
              const { className, children } = props;
              const match = /language-(\w+)/.exec(className || "");

              return match ? (
                <div className="relative group">
                  <div className="absolute right-0 bottom-0">
                    <span className="text-white text-xs">
                      {match[1]}
                    </span>
                  </div>
                  <div className="absolute right-0 top-0">
                    <CopyButton content={String(children).replace(/\n$/, "")} />
                  </div>
                  <SyntaxHighlighter
                    showLineNumbers
                    wrapLines
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    className="!bg-[#1E1E1E] !border-0 !rounded-md overflow-x-hidden scrollbar-hide"
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <span
                  className={`${className} font-mono text-gray-700 bg-muted px-1.5 py-0.5 rounded text-sm`}
                  {...props}
                >
                  {children}
                </span>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
        <div className="flex justify-start mt-2">
          <CopyButton content={content} className="hover:bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
