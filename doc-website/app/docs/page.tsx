import { DocHeader } from "../components/doc-header";
import { DocFooter } from "../components/doc-footer";
import { DocHome } from "../components/doc-home";

export default function DocsIndex() {
  return (
    <div className="min-h-screen flex flex-col">
      <DocHeader />
      <main id="content" className="container-pad py-12 flex-1">
        <DocHome />
      </main>
      <DocFooter />
    </div>
  );
}
