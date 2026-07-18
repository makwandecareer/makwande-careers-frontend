"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import type { StudioDraft, StudioSection } from "@/lib/cv-studio";

type PreviewPanelProps = {
  draft: StudioDraft;
  zoom: number;
  setZoom: (zoom: number) => void;
};

type PreviewBlock = {
  key: string;
  section: StudioSection;
  title: string;
  node: ReactNode;
};

type MeasuredBlock = {
  plain: number;
  titled: number;
};

type PaginatedBlock = PreviewBlock & {
  showHeading: boolean;
  continued: boolean;
};

type Page = PaginatedBlock[];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.2;
const ZOOM_STEP = 0.1;
const FIT_ZOOM = 0.82;
const FALLBACK_FIRST_PAGE_HEIGHT = 870;
const FALLBACK_CONTINUATION_HEIGHT = 960;

function value(record: Record<string, unknown>, key: string): string {
  return String(record[key] ?? "").trim();
}

function hasMeaningfulValue(
  record: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.some((key) => value(record, key).length > 0);
}

function clampZoom(valueToClamp: number): number {
  return Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, Number(valueToClamp.toFixed(2))),
  );
}

function blockColumn(
  draft: StudioDraft,
  section: StudioSection,
): "left" | "right" {
  if (draft.layout !== "two-column") return "left";

  const sidebarSections: StudioSection[] = [
    "summary",
    "skills",
    "certifications",
    "languages",
    "references",
  ];
  const sidebarOnRight = draft.templateLayout === "sidebar-right";
  const isSidebarSection = sidebarSections.includes(section);

  if (sidebarOnRight) return isSidebarSection ? "right" : "left";
  return isSidebarSection ? "left" : "right";
}

function paginateMeasuredBlocks(
  draft: StudioDraft,
  blocks: PreviewBlock[],
  measurements: Map<string, MeasuredBlock>,
  firstPageHeight: number,
  continuationPageHeight: number,
): Page[] {
  if (blocks.length === 0) return [[]];

  const pages: Page[] = [];
  let page: Page = [];
  let leftHeight = 0;
  let rightHeight = 0;
  let pageIndex = 0;

  const pushPage = (): void => {
    if (page.length > 0) pages.push(page);
    page = [];
    leftHeight = 0;
    rightHeight = 0;
    pageIndex += 1;
  };

  blocks.forEach((block, blockIndex) => {
    const previousBlock = blocks[blockIndex - 1];
    const startsSection = !previousBlock || previousBlock.section !== block.section;
    const capacity =
      pageIndex === 0 ? firstPageHeight : continuationPageHeight;
    const column = blockColumn(draft, block.section);
    const measurement = measurements.get(block.key);

    const pageStartsMidSection =
      page.length === 0 && !startsSection;
    let showHeading = startsSection || pageStartsMidSection;
    let height = measurement
      ? showHeading
        ? measurement.titled
        : measurement.plain
      : 120;

    const currentHeight = column === "left" ? leftHeight : rightHeight;
    const wouldOverflow = page.length > 0 && currentHeight + height > capacity;

    if (wouldOverflow) {
      pushPage();
      showHeading = true;
      height = measurement?.titled ?? height;
    }

    page.push({
      ...block,
      showHeading,
      continued: showHeading && !startsSection,
    });

    if (column === "left") leftHeight += height;
    else rightHeight += height;
  });

  if (page.length > 0) pages.push(page);
  return pages.length > 0 ? pages : [[]];
}

function buildPreviewBlocks(draft: StudioDraft): PreviewBlock[] {
  const visible = (section: StudioSection): boolean =>
    !draft.hiddenSections.includes(section);
  const blocks: PreviewBlock[] = [];

  if (visible("summary") && draft.profile.summary.trim()) {
    blocks.push({
      key: "summary-0",
      section: "summary",
      title: "Professional Summary",
      node: <p>{draft.profile.summary}</p>,
    });
  }

  if (visible("experience")) {
    draft.experience
      .filter((entry) =>
        hasMeaningfulValue(entry, ["job_title", "company", "description"]),
      )
      .forEach((entry, index) => {
        blocks.push({
          key: `experience-${value(entry, "id") || index}`,
          section: "experience",
          title: "Professional Experience",
          node: (
            <PreviewEntry
              title={value(entry, "job_title")}
              subtitle={value(entry, "company")}
              meta={[
                value(entry, "start_date"),
                value(entry, "end_date"),
                value(entry, "location"),
              ]
                .filter(Boolean)
                .join(" · ")}
              description={value(entry, "description")}
            />
          ),
        });
      });
  }

  if (visible("education")) {
    draft.education
      .filter((entry) =>
        hasMeaningfulValue(entry, [
          "qualification",
          "institution",
          "field_of_study",
        ]),
      )
      .forEach((entry, index) => {
        blocks.push({
          key: `education-${value(entry, "id") || index}`,
          section: "education",
          title: "Education",
          node: (
            <PreviewEntry
              title={value(entry, "qualification")}
              subtitle={value(entry, "institution")}
              meta={[
                value(entry, "start_date"),
                value(entry, "end_date"),
                value(entry, "field_of_study"),
              ]
                .filter(Boolean)
                .join(" · ")}
              description={value(entry, "description")}
            />
          ),
        });
      });
  }

  if (visible("skills")) {
    const skills = draft.skills
      .map((entry) => value(entry, "name"))
      .filter(Boolean);

    for (let index = 0; index < skills.length; index += 9) {
      const chunk = skills.slice(index, index + 9);
      blocks.push({
        key: `skills-${index / 9}`,
        section: "skills",
        title: "Core Skills",
        node: (
          <div className="studio-preview-skills">
            {chunk.map((skill, skillIndex) => (
              <span key={`${skill}-${skillIndex}`}>{skill}</span>
            ))}
          </div>
        ),
      });
    }
  }

  if (visible("projects")) {
    draft.projects
      .filter((entry) =>
        hasMeaningfulValue(entry, ["name", "description", "project_url"]),
      )
      .forEach((entry, index) => {
        blocks.push({
          key: `project-${value(entry, "id") || index}`,
          section: "projects",
          title: "Projects",
          node: (
            <PreviewEntry
              title={value(entry, "name")}
              subtitle={value(entry, "project_url")}
              meta={[value(entry, "start_date"), value(entry, "end_date")]
                .filter(Boolean)
                .join(" · ")}
              description={value(entry, "description")}
            />
          ),
        });
      });
  }

  if (visible("certifications")) {
    draft.certifications
      .filter((entry) => hasMeaningfulValue(entry, ["name", "issuer"]))
      .forEach((entry, index) => {
        blocks.push({
          key: `certification-${value(entry, "id") || index}`,
          section: "certifications",
          title: "Certifications",
          node: (
            <ul className="studio-compact-list">
              <li>
                <strong>{value(entry, "name")}</strong>
                {value(entry, "issuer")
                  ? ` — ${value(entry, "issuer")}`
                  : ""}
              </li>
            </ul>
          ),
        });
      });
  }

  if (visible("languages")) {
    draft.languages
      .filter((entry) => hasMeaningfulValue(entry, ["name", "proficiency"]))
      .forEach((entry, index) => {
        blocks.push({
          key: `language-${value(entry, "id") || index}`,
          section: "languages",
          title: "Languages",
          node: (
            <ul className="studio-compact-list">
              <li>
                <strong>{value(entry, "name")}</strong>
                {value(entry, "proficiency")
                  ? ` — ${value(entry, "proficiency")}`
                  : ""}
              </li>
            </ul>
          ),
        });
      });
  }

  if (visible("references")) {
    draft.references
      .filter((entry) =>
        hasMeaningfulValue(entry, ["full_name", "company", "email", "phone"]),
      )
      .forEach((entry, index) => {
        blocks.push({
          key: `reference-${value(entry, "id") || index}`,
          section: "references",
          title: "References",
          node: (
            <div className="studio-reference-item">
              <strong>{value(entry, "full_name")}</strong>
              <p>
                {[value(entry, "relationship"), value(entry, "company")]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>
                {[value(entry, "email"), value(entry, "phone")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ),
        });
      });
  }

  const order = new Map(
    draft.sectionOrder.map((section, index) => [section, index]),
  );

  return blocks.sort(
    (left, right) =>
      (order.get(left.section) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.section) ?? Number.MAX_SAFE_INTEGER),
  );
}

function getPageStyle(draft: StudioDraft): CSSProperties {
  const padding =
    draft.margin === "narrow"
      ? "34px 38px"
      : draft.margin === "wide"
        ? "72px 78px"
        : "54px 58px";

  return {
    "--studio-accent": draft.accent,
    "--studio-secondary": draft.secondaryAccent,
    "--studio-heading-font": draft.headingFont,
    "--studio-section-spacing": `${draft.sectionSpacing}px`,
    fontFamily: draft.fontFamily,
    fontSize: `${draft.fontSize}px`,
    lineHeight: draft.lineHeight,
    padding,
  } as CSSProperties;
}

function pageClassName(draft: StudioDraft): string {
  return [
    "studio-cv-page",
    `studio-layout-${draft.layout}`,
    `studio-header-${draft.headerStyle}`,
    `studio-template-${draft.templateLayout || "default"}`,
  ].join(" ");
}

export function PreviewPanel({ draft, zoom, setZoom }: PreviewPanelProps) {
  const blocks = useMemo(() => buildPreviewBlocks(draft), [draft]);
  const pageStyle = useMemo(() => getPageStyle(draft), [draft]);
  const measurerRef = useRef<HTMLDivElement | null>(null);
  const firstContentRef = useRef<HTMLDivElement | null>(null);
  const continuationContentRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<Page[]>([[]]);
  const [isMeasuring, setIsMeasuring] = useState(true);

  useLayoutEffect(() => {
    const root = measurerRef.current;
    if (!root) return;

    let frame = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = (): void => {
      frame = window.requestAnimationFrame(() => {
        const measurements = new Map<string, MeasuredBlock>();

        blocks.forEach((block) => {
          const plain = root.querySelector<HTMLElement>(
            `[data-measure-plain="${CSS.escape(block.key)}"]`,
          );
          const titled = root.querySelector<HTMLElement>(
            `[data-measure-titled="${CSS.escape(block.key)}"]`,
          );

          measurements.set(block.key, {
            plain: plain?.getBoundingClientRect().height ?? 120,
            titled: titled?.getBoundingClientRect().height ?? 150,
          });
        });

        const firstHeight =
          firstContentRef.current?.getBoundingClientRect().height ??
          FALLBACK_FIRST_PAGE_HEIGHT;
        const continuationHeight =
          continuationContentRef.current?.getBoundingClientRect().height ??
          FALLBACK_CONTINUATION_HEIGHT;

        setPages(
          paginateMeasuredBlocks(
            draft,
            blocks,
            measurements,
            firstHeight,
            continuationHeight,
          ),
        );
        setIsMeasuring(false);
      });
    };

    const scheduleMeasure = (): void => {
      setIsMeasuring(true);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(measure, 120);
    };

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(root);

    void document.fonts?.ready.then(scheduleMeasure);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [blocks, draft]);

  return (
    <section className="studio-preview-panel">
      <header className="studio-preview-toolbar">
        <div>
          <strong>Live preview</strong>
          <span>
            A4 employer view · {pages.length} {pages.length === 1 ? "page" : "pages"}
            {isMeasuring ? " · Paginating…" : ""}
          </span>
        </div>

        <div className="studio-zoom-controls">
          <button
            type="button"
            onClick={() => setZoom(clampZoom(zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom(clampZoom(zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
          <button type="button" onClick={() => setZoom(FIT_ZOOM)}>
            Fit
          </button>
        </div>
      </header>

      <div className="studio-preview-canvas">
        <div
          className="studio-preview-pages"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {pages.map((page, pageIndex) => (
            <article
              className={pageClassName(draft)}
              style={pageStyle}
              key={`page-${pageIndex + 1}`}
            >
              {pageIndex === 0 ? (
                <CVHeader draft={draft} />
              ) : (
                <ContinuationHeader draft={draft} />
              )}

              <div className="studio-cv-content">
                {page.length > 0 ? (
                  page.map((block) => (
                    <PreviewBlockView block={block} key={block.key} />
                  ))
                ) : (
                  <div className="studio-cv-empty-preview">
                    Add CV content to see your live preview.
                  </div>
                )}
              </div>

              <footer className="studio-cv-page-footer">
                <span>{draft.profile.fullName}</span>
                <span>
                  Page {pageIndex + 1} of {pages.length}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <div
        ref={measurerRef}
        className="studio-pagination-measurer"
        aria-hidden="true"
      >
        <article className={pageClassName(draft)} style={pageStyle}>
          <CVHeader draft={draft} />
          <div ref={firstContentRef} className="studio-cv-content" />
          <footer className="studio-cv-page-footer">
            <span>{draft.profile.fullName}</span>
            <span>Page 1</span>
          </footer>
        </article>

        <article className={pageClassName(draft)} style={pageStyle}>
          <ContinuationHeader draft={draft} />
          <div ref={continuationContentRef} className="studio-cv-content" />
          <footer className="studio-cv-page-footer">
            <span>{draft.profile.fullName}</span>
            <span>Page 2</span>
          </footer>
        </article>

        <div className="studio-measure-blocks">
          {blocks.map((block) => (
            <div key={block.key}>
              <article className={pageClassName(draft)} style={pageStyle}>
                <div className="studio-cv-content">
                  <PreviewBlockView
                    measureKind="plain"
                    block={{ ...block, showHeading: false, continued: false }}
                  />
                </div>
              </article>
              <article className={pageClassName(draft)} style={pageStyle}>
                <div className="studio-cv-content">
                  <PreviewBlockView
                    measureKind="titled"
                    block={{ ...block, showHeading: true, continued: false }}
                  />
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewBlockView({
  block,
  measureKind,
}: {
  block: PaginatedBlock;
  measureKind?: "plain" | "titled";
}) {
  const measureProps = measureKind
    ? { [`data-measure-${measureKind}`]: block.key }
    : {};

  return (
    <div
      {...measureProps}
      className={[
        `studio-section-${block.section}`,
        "studio-pagination-block",
        block.showHeading ? "has-heading" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <section className="studio-cv-section">
        {block.showHeading ? (
          <h2>
            {block.title}
            {block.continued ? " (continued)" : ""}
          </h2>
        ) : null}
        {block.node}
      </section>
    </div>
  );
}

function ContinuationHeader({ draft }: { draft: StudioDraft }) {
  return (
    <div className="studio-cv-continuation-header">
      <strong>{draft.profile.fullName}</strong>
      <span>{draft.targetRole || draft.profile.professionalTitle}</span>
    </div>
  );
}

function CVHeader({ draft }: { draft: StudioDraft }) {
  const contactItems = [
    draft.profile.phone,
    draft.profile.email,
    draft.profile.location,
    draft.profile.linkedin,
    draft.profile.website,
  ].filter(Boolean);

  return (
    <header className="studio-cv-header">
      {draft.showPhoto && draft.photoUrl ? (
        <Image
          src={draft.photoUrl}
          alt={`${draft.profile.fullName} profile`}
          className={`studio-cv-photo ${draft.photoShape}`}
          width={112}
          height={112}
          unoptimized
        />
      ) : null}

      <div className="studio-cv-heading">
        <h1>{draft.profile.fullName || "Your name"}</h1>
        <p>
          {draft.targetRole ||
            draft.profile.professionalTitle ||
            "Professional title"}
        </p>

        {contactItems.length > 0 ? (
          <div className="studio-cv-contact">
            {contactItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function PreviewEntry({
  title,
  subtitle,
  meta,
  description,
}: {
  title: string;
  subtitle: string;
  meta: string;
  description: string;
}) {
  return (
    <div className="studio-cv-entry">
      <div className="studio-cv-entry-heading">
        <div>
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <strong>{subtitle}</strong> : null}
        </div>
        {meta ? <span>{meta}</span> : null}
      </div>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
