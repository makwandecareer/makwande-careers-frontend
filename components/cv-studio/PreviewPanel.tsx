"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type {
  StudioDraft,
  StudioSection,
} from "@/lib/cv-studio";

type PreviewPanelProps = {
  draft: StudioDraft;
  zoom: number;
  setZoom: (zoom: number) => void;
};

type PreviewBlock = {
  key: string;
  section: StudioSection;
  node: ReactNode;
  weight: number;
  splittable?: boolean;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.2;
const ZOOM_STEP = 0.1;
const FIT_ZOOM = 0.82;

/*
 * Page units approximate the usable A4 content area after margins,
 * header and footer. This keeps entire sections together whenever
 * possible and only moves a section to the next page when necessary.
 */
const FIRST_PAGE_CAPACITY = 106;
const CONTINUATION_PAGE_CAPACITY = 118;

function value(
  record: Record<string, unknown>,
  key: string,
): string {
  return String(record[key] ?? "").trim();
}

function hasMeaningfulValue(
  record: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.some((key) => value(record, key).length > 0);
}

function estimateTextWeight(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 88));
}

function clampZoom(valueToClamp: number): number {
  return Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, Number(valueToClamp.toFixed(2))),
  );
}

function paginateBlocks(
  blocks: PreviewBlock[],
): PreviewBlock[][] {
  if (blocks.length === 0) return [[]];

  const pages: PreviewBlock[][] = [];
  let currentPage: PreviewBlock[] = [];
  let currentWeight = 0;
  let pageCapacity = FIRST_PAGE_CAPACITY;

  for (const block of blocks) {
    const fitsCurrentPage =
      currentWeight + block.weight <= pageCapacity;

    if (fitsCurrentPage || currentPage.length === 0) {
      currentPage.push(block);
      currentWeight += block.weight;
      continue;
    }

    pages.push(currentPage);
    currentPage = [block];
    currentWeight = block.weight;
    pageCapacity = CONTINUATION_PAGE_CAPACITY;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function buildPreviewBlocks(
  draft: StudioDraft,
): PreviewBlock[] {
  const visible = (section: StudioSection): boolean =>
    !draft.hiddenSections.includes(section);

  const blocks: PreviewBlock[] = [];

  if (visible("summary") && draft.profile.summary.trim()) {
    blocks.push({
      key: "summary",
      section: "summary",
      weight: 12 + estimateTextWeight(draft.profile.summary) * 4,
      node: (
        <PreviewSection title="Professional Summary">
          <p>{draft.profile.summary}</p>
        </PreviewSection>
      ),
    });
  }

  if (visible("experience")) {
    const entries = draft.experience.filter((entry) =>
      hasMeaningfulValue(entry, [
        "job_title",
        "company",
        "description",
      ]),
    );

    if (entries.length > 0) {
      blocks.push({
        key: "experience",
        section: "experience",
        weight:
          14 +
          entries.reduce(
            (total, entry) =>
              total +
              10 +
              estimateTextWeight(value(entry, "description")) * 4,
            0,
          ),
        node: (
          <PreviewSection title="Professional Experience">
            {entries.map((entry, index) => (
              <PreviewEntry
                key={`${value(entry, "id") || "experience"}-${index}`}
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
            ))}
          </PreviewSection>
        ),
      });
    }
  }

  if (visible("education")) {
    const entries = draft.education.filter((entry) =>
      hasMeaningfulValue(entry, [
        "qualification",
        "institution",
        "field_of_study",
      ]),
    );

    if (entries.length > 0) {
      blocks.push({
        key: "education",
        section: "education",
        weight:
          13 +
          entries.reduce(
            (total, entry) =>
              total +
              8 +
              estimateTextWeight(value(entry, "description")) * 3,
            0,
          ),
        node: (
          <PreviewSection title="Education">
            {entries.map((entry, index) => (
              <PreviewEntry
                key={`${value(entry, "id") || "education"}-${index}`}
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
            ))}
          </PreviewSection>
        ),
      });
    }
  }

  if (visible("skills")) {
    const skills = draft.skills
      .map((entry) => value(entry, "name"))
      .filter(Boolean);

    if (skills.length > 0) {
      blocks.push({
        key: "skills",
        section: "skills",
        weight: 10 + Math.ceil(skills.length / 3) * 5,
        node: (
          <PreviewSection title="Core Skills">
            <div className="studio-preview-skills">
              {skills.map((skill, index) => (
                <span key={`${skill}-${index}`}>{skill}</span>
              ))}
            </div>
          </PreviewSection>
        ),
      });
    }
  }

  if (visible("projects")) {
    const entries = draft.projects.filter((entry) =>
      hasMeaningfulValue(entry, [
        "name",
        "description",
        "project_url",
      ]),
    );

    if (entries.length > 0) {
      blocks.push({
        key: "projects",
        section: "projects",
        weight:
          12 +
          entries.reduce(
            (total, entry) =>
              total +
              8 +
              estimateTextWeight(value(entry, "description")) * 3,
            0,
          ),
        node: (
          <PreviewSection title="Projects">
            {entries.map((entry, index) => (
              <PreviewEntry
                key={`${value(entry, "id") || "project"}-${index}`}
                title={value(entry, "name")}
                subtitle={value(entry, "project_url")}
                meta={[
                  value(entry, "start_date"),
                  value(entry, "end_date"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                description={value(entry, "description")}
              />
            ))}
          </PreviewSection>
        ),
      });
    }
  }

  if (visible("certifications")) {
    const entries = draft.certifications.filter((entry) =>
      hasMeaningfulValue(entry, ["name", "issuer"]),
    );

    if (entries.length > 0) {
      blocks.push({
        key: "certifications",
        section: "certifications",
        weight: 9 + entries.length * 5,
        node: (
          <PreviewSection title="Certifications">
            <ul>
              {entries.map((entry, index) => (
                <li
                  key={`${value(entry, "id") || "certification"}-${index}`}
                >
                  <strong>{value(entry, "name")}</strong>
                  {value(entry, "issuer")
                    ? ` — ${value(entry, "issuer")}`
                    : ""}
                </li>
              ))}
            </ul>
          </PreviewSection>
        ),
      });
    }
  }

  if (visible("languages")) {
    const entries = draft.languages.filter((entry) =>
      hasMeaningfulValue(entry, ["name", "proficiency"]),
    );

    if (entries.length > 0) {
      blocks.push({
        key: "languages",
        section: "languages",
        weight: 8 + entries.length * 4,
        node: (
          <PreviewSection title="Languages">
            <ul>
              {entries.map((entry, index) => (
                <li
                  key={`${value(entry, "id") || "language"}-${index}`}
                >
                  <strong>{value(entry, "name")}</strong>
                  {value(entry, "proficiency")
                    ? ` — ${value(entry, "proficiency")}`
                    : ""}
                </li>
              ))}
            </ul>
          </PreviewSection>
        ),
      });
    }
  }

  if (visible("references")) {
    const entries = draft.references.filter((entry) =>
      hasMeaningfulValue(entry, [
        "full_name",
        "company",
        "email",
        "phone",
      ]),
    );

    if (entries.length > 0) {
      blocks.push({
        key: "references",
        section: "references",
        weight: 11 + Math.ceil(entries.length / 2) * 9,
        node: (
          <PreviewSection title="References">
            <div className="studio-reference-grid">
              {entries.map((entry, index) => (
                <div
                  key={`${value(entry, "id") || "reference"}-${index}`}
                >
                  <strong>{value(entry, "full_name")}</strong>
                  <p>
                    {[
                      value(entry, "relationship"),
                      value(entry, "company"),
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>
                    {[
                      value(entry, "email"),
                      value(entry, "phone"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </PreviewSection>
        ),
      });
    }
  }

  const order = new Map(
    draft.sectionOrder.map((section, index) => [
      section,
      index,
    ]),
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

export function PreviewPanel({
  draft,
  zoom,
  setZoom,
}: PreviewPanelProps) {
  const blocks = buildPreviewBlocks(draft);
  const pages = paginateBlocks(blocks);
  const pageStyle = getPageStyle(draft);

  return (
    <section className="studio-preview-panel">
      <header className="studio-preview-toolbar">
        <div>
          <strong>Live preview</strong>
          <span>
            A4 employer view · {pages.length}{" "}
            {pages.length === 1 ? "page" : "pages"}
          </span>
        </div>

        <div className="studio-zoom-controls">
          <button
            type="button"
            onClick={() =>
              setZoom(clampZoom(zoom - ZOOM_STEP))
            }
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>

          <span>{Math.round(zoom * 100)}%</span>

          <button
            type="button"
            onClick={() =>
              setZoom(clampZoom(zoom + ZOOM_STEP))
            }
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => setZoom(FIT_ZOOM)}
          >
            Fit
          </button>
        </div>
      </header>

      <div className="studio-preview-canvas">
        <div
          className="studio-preview-pages"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          {pages.map((page, pageIndex) => (
            <article
              className={[
                "studio-cv-page",
                `studio-layout-${draft.layout}`,
                `studio-header-${draft.headerStyle}`,
                `studio-template-${
                  draft.templateLayout || "default"
                }`,
              ].join(" ")}
              style={pageStyle}
              key={`page-${pageIndex + 1}`}
            >
              {pageIndex === 0 ? (
                <CVHeader draft={draft} />
              ) : (
                <div className="studio-cv-continuation-header">
                  <strong>{draft.profile.fullName}</strong>
                  <span>
                    {draft.targetRole ||
                      draft.profile.professionalTitle}
                  </span>
                </div>
              )}

              <div className="studio-cv-content">
                {page.length > 0 ? (
                  page.map((block) => (
                    <div
                      key={block.key}
                      className={`studio-section-${block.section}`}
                    >
                      {block.node}
                    </div>
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
    </section>
  );
}

function CVHeader({
  draft,
}: {
  draft: StudioDraft;
}) {
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

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="studio-cv-section">
      <h2>{title}</h2>
      {children}
    </section>
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
