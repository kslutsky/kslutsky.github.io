/**
 * Career timeline SVG — dual-track academic / industry path.
 *
 * Geometry is translated directly from the v9 mockup.  Colors swap between
 * light and dark mode via CSS custom properties (for solid fills) and
 * duplicated gradient definitions toggled with `.career-light` / `.career-dark`
 * CSS classes (because SVG stop-color does not support `var()` cross-browser).
 *
 * Server component — no client JS needed.
 */

/* ------------------------------------------------------------------ */
/* Color palettes for gradient definitions                             */
/* ------------------------------------------------------------------ */

// Academic track gradient colors
const ACAD_LIGHT = {
  base: "#047857",
  mid: "#059669",
  bright: "#06a873",
  deep: "#065f46",
};

const ACAD_DARK = {
  base: "#059669",
  mid: "#0ea87a",
  bright: "#10b981",
  deep: "#047857",
};

// Industry track gradient colors
const IND_LIGHT = {
  base: "#475569",
  mid: "#546378",
  bright: "#64748b",
  deep: "#334155",
};

const IND_DARK = {
  base: "#64748b",
  mid: "#72829a",
  bright: "#7d90a8",
  deep: "#475569",
};

/* ------------------------------------------------------------------ */
/* Gradient definitions (one set per theme)                            */
/* ------------------------------------------------------------------ */

function GradientDefs({
  suffix,
  acad,
  ind,
}: {
  suffix: string;
  acad: typeof ACAD_LIGHT;
  ind: typeof IND_LIGHT;
}) {
  return (
    <>
      {/* PhD UIUC: x=20..170 */}
      <linearGradient
        id={`seg-phd-${suffix}`}
        x1="20"
        y1="0"
        x2="170"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.base} />
        <stop offset="80%" stopColor={acad.base} />
        <stop offset="100%" stopColor={acad.mid} />
      </linearGradient>

      {/* Postdoc Copenhagen: x=170..290 */}
      <linearGradient
        id={`seg-copen-${suffix}`}
        x1="170"
        y1="0"
        x2="290"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.mid} />
        <stop offset="15%" stopColor={acad.bright} />
        <stop offset="85%" stopColor={acad.bright} />
        <stop offset="100%" stopColor={acad.mid} />
      </linearGradient>

      {/* Postdoc UIC: x=290..440 */}
      <linearGradient
        id={`seg-uic-${suffix}`}
        x1="290"
        y1="0"
        x2="440"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.mid} />
        <stop offset="12%" stopColor={acad.bright} />
        <stop offset="100%" stopColor={acad.bright} />
      </linearGradient>

      {/* S-curve down: academic -> industry */}
      <linearGradient
        id={`seg-sdown-${suffix}`}
        x1="437"
        y1="0"
        x2="503"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.bright} />
        <stop offset="100%" stopColor={ind.base} />
      </linearGradient>

      {/* Sr SWE nuTonomy: x=500..620 */}
      <linearGradient
        id={`seg-nutswe-${suffix}`}
        x1="500"
        y1="0"
        x2="620"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={ind.base} />
        <stop offset="80%" stopColor={ind.base} />
        <stop offset="100%" stopColor={ind.mid} />
      </linearGradient>

      {/* Sr Res Sci nuTonomy: x=620..750 */}
      <linearGradient
        id={`seg-nutres-${suffix}`}
        x1="620"
        y1="0"
        x2="750"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={ind.mid} />
        <stop offset="12%" stopColor={ind.bright} />
        <stop offset="100%" stopColor={ind.bright} />
      </linearGradient>

      {/* S-curve up: industry -> academic */}
      <linearGradient
        id={`seg-sup-${suffix}`}
        x1="747"
        y1="0"
        x2="813"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={ind.bright} />
        <stop offset="100%" stopColor={acad.mid} />
      </linearGradient>

      {/* Postdoc Paris: x=810..920 */}
      <linearGradient
        id={`seg-paris-${suffix}`}
        x1="810"
        y1="0"
        x2="920"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.mid} />
        <stop offset="85%" stopColor={acad.mid} />
        <stop offset="100%" stopColor={acad.base} />
      </linearGradient>

      {/* Asst Prof ISU: x=920..1200 */}
      <linearGradient
        id={`seg-isu-${suffix}`}
        x1="920"
        y1="0"
        x2="1200"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.base} />
        <stop offset="8%" stopColor={acad.base} />
        <stop offset="100%" stopColor={acad.base} />
      </linearGradient>

      {/* S-curve fork: academic -> industry (ISU -> Venti) */}
      <linearGradient
        id={`seg-sfork-${suffix}`}
        x1="997"
        y1="0"
        x2="1063"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={acad.base} />
        <stop offset="100%" stopColor={ind.base} />
      </linearGradient>

      {/* Venti: x=1060..1200 */}
      <linearGradient
        id={`seg-venti-${suffix}`}
        x1="1060"
        y1="0"
        x2="1200"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={ind.base} />
        <stop offset="100%" stopColor={ind.base} />
      </linearGradient>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Dual-theme element helpers                                          */
/* ------------------------------------------------------------------ */

/**
 * Renders two copies of a gradient-filled SVG element: one for light mode,
 * one for dark mode, toggled via CSS classes.
 */
function DualRect(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
  gradientId: string;
  title?: string;
}) {
  const { x, y, width, height, rx, ry, gradientId, title } = props;
  return (
    <>
      <rect
        className="career-light"
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        ry={ry}
        fill={`url(#${gradientId}-light)`}
      >
        {title && <title>{title}</title>}
      </rect>
      <rect
        className="career-dark"
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        ry={ry}
        fill={`url(#${gradientId}-dark)`}
      >
        {title && <title>{title}</title>}
      </rect>
    </>
  );
}

function DualPath(props: { d: string; gradientId: string }) {
  const { d, gradientId } = props;
  return (
    <>
      <path className="career-light" d={d} fill={`url(#${gradientId}-light)`} />
      <path className="career-dark" d={d} fill={`url(#${gradientId}-dark)`} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function CareerTimeline() {
  return (
    <svg
      viewBox="0 0 1230 235"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", minWidth: 1210 }}
      role="img"
      aria-labelledby="career-timeline-title"
    >
      <title id="career-timeline-title">
        Career timeline of Konstantin Slutsky
      </title>

      {/* ============================================================ */}
      {/* GRADIENT DEFINITIONS — light and dark sets                    */}
      {/* ============================================================ */}
      <defs>
        <GradientDefs suffix="light" acad={ACAD_LIGHT} ind={IND_LIGHT} />
        <GradientDefs suffix="dark" acad={ACAD_DARK} ind={IND_DARK} />
      </defs>

      {/* ============================================================ */}
      {/* DASHED VERTICAL LINES (lowest z-index)                       */}
      {/* ============================================================ */}
      {[
        { x: 20, y1: 55 },
        { x: 170, y1: 55 },
        { x: 290, y1: 55 },
        { x: 500, y1: 115 },
        { x: 620, y1: 115 },
        { x: 810, y1: 55 },
        { x: 920, y1: 55 },
        { x: 1060, y1: 115 },
      ].map(({ x, y1 }) => (
        <line
          key={x}
          x1={x}
          y1={y1}
          x2={x}
          y2={195}
          style={{ stroke: "var(--text-muted)" }}
          strokeWidth="1"
          strokeDasharray="3,4"
          opacity="0.3"
        />
      ))}

      {/* ============================================================ */}
      {/* S-CURVES (drawn after dashed lines, before bars)             */}
      {/* Extended 3px each side for seam prevention                    */}
      {/* ============================================================ */}

      {/* S-DOWN: UIC -> nuTonomy */}
      <DualPath
        d="M 437 55 C 470 55, 470 115, 503 115 L 503 147 C 470 147, 470 87, 437 87 Z"
        gradientId="seg-sdown"
      />

      {/* S-UP: nuTonomy -> Paris */}
      <DualPath
        d="M 747 115 C 780 115, 780 55, 813 55 L 813 87 C 780 87, 780 147, 747 147 Z"
        gradientId="seg-sup"
      />

      {/* S-DOWN: ISU -> Venti fork */}
      <DualPath
        d="M 997 55 C 1030 55, 1030 115, 1063 115 L 1063 147 C 1030 147, 1030 87, 997 87 Z"
        gradientId="seg-sfork"
      />

      {/* ============================================================ */}
      {/* ACADEMIC BARS                                                 */}
      {/* ============================================================ */}

      {/* PhD UIUC — left-rounded */}
      <DualRect
        x={20}
        y={55}
        width={150}
        height={32}
        rx={16}
        ry={16}
        gradientId="seg-phd"
        title="University of Illinois at Urbana-Champaign"
      />
      {/* Square-off right side of PhD */}
      <DualRect
        x={36}
        y={55}
        width={134}
        height={32}
        gradientId="seg-phd"
        title="University of Illinois at Urbana-Champaign"
      />

      {/* Postdoc Copenhagen — starts 1px early for overlap with PhD */}
      <DualRect
        x={169}
        y={55}
        width={121}
        height={32}
        gradientId="seg-copen"
        title="University of Copenhagen"
      />

      {/* Postdoc UIC — starts 1px early, extends 2px into S-down */}
      <DualRect
        x={289}
        y={55}
        width={150}
        height={32}
        gradientId="seg-uic"
        title="University of Illinois at Chicago"
      />

      {/* Postdoc Paris — starts 2px before S-up end for overlap */}
      <DualRect
        x={811}
        y={55}
        width={109}
        height={32}
        gradientId="seg-paris"
        title="CNRS / Paris Diderot University"
      />

      {/* Asst Prof ISU — extends 1px past arrow base for overlap */}
      <DualRect
        x={919}
        y={55}
        width={282}
        height={32}
        gradientId="seg-isu"
        title="Iowa State University"
      />
      {/* ISU arrow tip */}
      <path
        className="career-light"
        d="M 1200 55 L 1212 71 L 1200 87 Z"
        style={{ fill: ACAD_LIGHT.base }}
      />
      <path
        className="career-dark"
        d="M 1200 55 L 1212 71 L 1200 87 Z"
        style={{ fill: ACAD_DARK.base }}
      />

      {/* ============================================================ */}
      {/* INDUSTRY BARS                                                 */}
      {/* ============================================================ */}

      {/* Sr SWE nuTonomy — starts 2px before S-down end for overlap */}
      <DualRect
        x={501}
        y={115}
        width={119}
        height={32}
        gradientId="seg-nutswe"
        title="nuTonomy Asia (acquired by Aptiv)"
      />

      {/* Sr Res Sci nuTonomy — starts 1px early, extends 2px into S-up */}
      <DualRect
        x={619}
        y={115}
        width={130}
        height={32}
        gradientId="seg-nutres"
        title="nuTonomy Asia (acquired by Aptiv)"
      />

      {/* Venti — extends 1px past arrow base for overlap */}
      <DualRect
        x={1061}
        y={115}
        width={140}
        height={32}
        gradientId="seg-venti"
        title="Venti Technologies"
      />
      {/* Venti arrow tip */}
      <path
        className="career-light"
        d="M 1200 115 L 1212 131 L 1200 147 Z"
        style={{ fill: IND_LIGHT.base }}
      />
      <path
        className="career-dark"
        d="M 1200 115 L 1212 131 L 1200 147 Z"
        style={{ fill: IND_DARK.base }}
      />

      {/* ============================================================ */}
      {/* INSTITUTION LABELS (inside bars, white text)                  */}
      {/* ============================================================ */}
      {[
        {
          x: 95,
          y: 71,
          size: 11,
          label: "UIUC",
          fullName: "University of Illinois at Urbana-Champaign",
        },
        {
          x: 230,
          y: 71,
          size: 11,
          label: "Copenhagen",
          fullName: "University of Copenhagen",
        },
        {
          x: 365,
          y: 71,
          size: 11,
          label: "UIC",
          fullName: "University of Illinois at Chicago",
        },
        {
          x: 560,
          y: 131,
          size: 11,
          label: "nuTonomy",
          fullName: "nuTonomy Asia",
        },
        {
          x: 685,
          y: 131,
          size: 11,
          label: "nuTonomy",
          fullName: "nuTonomy Asia",
        },
        {
          x: 865,
          y: 71,
          size: 11,
          label: "Paris Diderot",
          fullName: "CNRS / Paris Diderot University",
          letterSpacing: "-0.3",
        },
        {
          x: 1060,
          y: 71,
          size: 11,
          label: "Iowa State",
          fullName: "Iowa State University",
        },
        {
          x: 1130,
          y: 131,
          size: 11,
          label: "Venti",
          fullName: "Venti Technologies",
        },
      ].map((t) => (
        <text
          key={`${t.x}-${t.y}`}
          x={t.x}
          y={t.y}
          fontSize={t.size}
          fill="white"
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          opacity="0.95"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          letterSpacing={t.letterSpacing}
        >
          <title>{t.fullName}</title>
          {t.label}
        </text>
      ))}

      {/* ============================================================ */}
      {/* POSITION TITLES (outside bars)                                */}
      {/* ============================================================ */}

      {/* Academic titles (above bars) */}
      {[
        { x: 95, label: "PhD", full: "Doctor of Philosophy" },
        { x: 230, label: "Postdoc", full: "Postdoctoral Researcher" },
        { x: 365, label: "Postdoc", full: "Postdoctoral Researcher" },
        { x: 865, label: "Postdoc", full: "Postdoctoral Researcher" },
        { x: 1060, label: "Assistant Professor", full: "Assistant Professor" },
      ].map((t) => (
        <text
          key={`pos-${t.x}`}
          x={t.x}
          y={44}
          fontSize={12}
          style={{ fill: "var(--text-primary)" }}
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          <title>{t.full}</title>
          {t.label}
        </text>
      ))}

      {/* Industry titles (below bars) — multi-line with tooltips */}
      <g>
        <title>Senior Software Engineer</title>
        <text
          x={560}
          y={160}
          fontSize={11}
          style={{ fill: "var(--text-primary)" }}
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          Sr. Software
        </text>
        <text
          x={560}
          y={173}
          fontSize={11}
          style={{ fill: "var(--text-primary)" }}
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          Engineer
        </text>
      </g>
      <g>
        <title>Senior Research Scientist</title>
        <text
          x={685}
          y={160}
          fontSize={11}
          style={{ fill: "var(--text-primary)" }}
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          Sr. Research
        </text>
        <text
          x={685}
          y={173}
          fontSize={11}
          style={{ fill: "var(--text-primary)" }}
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          Scientist
        </text>
      </g>
      <g>
        <title>Senior Advisor</title>
        <text
          x={1130}
          y={160}
          fontSize={11}
          style={{ fill: "var(--text-primary)" }}
          fontFamily="Inter,sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          Sr. Advisor
        </text>
      </g>

      {/* ============================================================ */}
      {/* YEAR AXIS                                                     */}
      {/* ============================================================ */}
      <line
        x1={20}
        y1={195}
        x2={1210}
        y2={195}
        style={{ stroke: "var(--border)" }}
        strokeWidth="1"
      />

      {[
        { x: 20, label: "2007" },
        { x: 170, label: "2012" },
        { x: 290, label: "2014" },
        { x: 500, label: "2017" },
        { x: 620, label: "2018" },
        { x: 810, label: "2019" },
        { x: 920, label: "2020" },
        { x: 1060, label: "2022" },
        { x: 1170, label: "2026" },
      ].map((t) => (
        <g key={`year-${t.x}`}>
          <line
            x1={t.x}
            y1={192}
            x2={t.x}
            y2={195}
            style={{ stroke: "var(--text-muted)" }}
            strokeWidth="1"
          />
          <text
            x={t.x}
            y={209}
            fontSize={10}
            style={{ fill: "var(--text-muted)" }}
            fontFamily="Inter,sans-serif"
            fontWeight="500"
          >
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
