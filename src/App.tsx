import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import AsyncApiPreview from "./components/AsyncApiPreview";
import { logEvent } from "./lib/logger";
const BASE = import.meta.env.BASE_URL;
const menuDarkIcon = `${BASE}icons/menu_dark.svg`;
const menuLightIcon = `${BASE}icons/menu_light.svg`;
const sunIcon = `${BASE}icons/sun.svg`;
const moonIcon = `${BASE}icons/moon.svg`;
const logoVector = `${BASE}logo_vector.svg`;
import {
	createShareHash,
	decodeShareHash,
	estimateCompressedBytes,
	resolveInitialSchema,
} from "./lib/schema";
import {
	detectFormatFromFileName,
	parseSpecText,
	serializeSpec,
	type SpecTextFormat,
} from "./lib/specText";
import { detectSpecKind } from "./lib/specType";
import { SAMPLE_SPEC } from "./sampleSpec";

const LOCAL_STORAGE_SCHEMA_KEY = "openapi:last-schema";
const LOCAL_STORAGE_THEME_KEY = "openapi:theme";
const COMPRESSED_WARNING_BYTES = 8_000;
const MIN_EDITOR_FONT_SIZE = 10;
const MAX_EDITOR_FONT_SIZE = 24;

type ThemeMode = "light" | "dark";
type ThemePreference = "system" | ThemeMode;
const MonacoEditor = lazy(() => import("@monaco-editor/react"));

function App() {
	const initial = useMemo(
		() =>
			resolveInitialSchema({
				hash: window.location.hash,
				localSchema: window.localStorage.getItem(LOCAL_STORAGE_SCHEMA_KEY),
				fallbackSchema: SAMPLE_SPEC,
			}),
		[],
	);

	const [schemaText, setSchemaText] = useState(initial.schemaText);
	const [parsedSpec, setParsedSpec] = useState<unknown | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [message, setMessage] = useState<string>(
		`Loaded from ${initial.source}.`,
	);
	const [isEditorCollapsed, setIsEditorCollapsed] = useState(true);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [editorFontSize, setEditorFontSize] = useState(13);
	const [parsedFormat, setParsedFormat] = useState<SpecTextFormat>("json");
	const [themePreference, setThemePreference] = useState<ThemePreference>(
		() => {
			const stored = window.localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
			return stored === "light" || stored === "dark" || stored === "system"
				? stored
				: "system";
		},
	);
	const [systemThemeMode, setSystemThemeMode] = useState<ThemeMode>(() => {
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	});
	const themeMode =
		themePreference === "system" ? systemThemeMode : themePreference;

	const suppressNextHashChange = useRef(false);
	const latestSavedHash = useRef<string>(window.location.hash);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const lastParseErrorRef = useRef<string | null>(null);
	const editorRef = useRef<{
		hasTextFocus: () => boolean;
		trigger: (source: string, handlerId: string, payload: unknown) => void;
	} | null>(null);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = (event: MediaQueryListEvent) => {
			setSystemThemeMode(event.matches ? "dark" : "light");
		};

		media.addEventListener("change", onChange);
		return () => {
			media.removeEventListener("change", onChange);
		};
	}, []);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", themeMode);
		window.localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themePreference);
		logEvent({
			level: "info",
			message: "Theme changed",
			context: { theme: themeMode, theme_preference: themePreference },
		});
	}, [themeMode, themePreference]);

	useEffect(() => {
		logEvent({
			level: "info",
			message: "App loaded",
			context: { source: initial.source },
		});
	}, [initial.source]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const isSelectAllShortcut =
				(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a";
			if (!isSelectAllShortcut) {
				return;
			}

			const editor = editorRef.current;
			if (!editor || !editor.hasTextFocus()) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			editor.trigger("keyboard", "editor.action.selectAll", null);
		};

		window.addEventListener("keydown", onKeyDown, true);
		return () => {
			window.removeEventListener("keydown", onKeyDown, true);
		};
	}, []);

	useEffect(() => {
		const handleHashChange = () => {
			if (
				suppressNextHashChange.current &&
				window.location.hash === latestSavedHash.current
			) {
				suppressNextHashChange.current = false;
				return;
			}

			const decoded = decodeShareHash(window.location.hash);
			if (decoded === null) {
				return;
			}

			setSchemaText(decoded);
			setMessage("Loaded schema from URL hash.");
			logEvent({
				level: "info",
				message: "Schema loaded from hash",
			});
		};

		window.addEventListener("hashchange", handleHashChange);
		return () => {
			window.removeEventListener("hashchange", handleHashChange);
		};
	}, []);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			try {
				const parsed = parseSpecText(schemaText);
				setParsedSpec(parsed.doc);
				setParsedFormat(parsed.format);
				setParseError(null);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Invalid schema";
				setParseError(message);
				setParsedSpec(null);
			}
		}, 250);

		return () => {
			window.clearTimeout(timeout);
		};
	}, [schemaText]);

	useEffect(() => {
		if (parseError !== null && parseError !== lastParseErrorRef.current) {
			logEvent({
				level: "warn",
				message: "Schema parse error",
				context: { error: parseError },
			});
		}

		lastParseErrorRef.current = parseError;
	}, [parseError]);

	const stats = useMemo(() => {
		const rawBytes = new TextEncoder().encode(schemaText).byteLength;
		const compressedBytes = estimateCompressedBytes(schemaText);
		return {
			rawBytes,
			compressedBytes,
			tooLarge: compressedBytes > COMPRESSED_WARNING_BYTES,
		};
	}, [schemaText]);

	const specKind = useMemo(() => detectSpecKind(parsedSpec), [parsedSpec]);

	const onSave = () => {
		try {
			parseSpecText(schemaText);
		} catch (error) {
			const failure = error instanceof Error ? error.message : "Invalid schema";
			setMessage(`Save blocked: ${failure}`);
			logEvent({
				level: "warn",
				message: "Save blocked due to invalid schema",
				context: { error: failure },
			});
			return;
		}

		const hashBody = createShareHash(schemaText);
		const hash = `#${hashBody}`;
		suppressNextHashChange.current = true;
		latestSavedHash.current = hash;
		window.location.hash = hashBody;
		window.localStorage.setItem(LOCAL_STORAGE_SCHEMA_KEY, schemaText);
		setMessage("Saved: URL hash + localStorage updated.");
		logEvent({
			level: "info",
			message: "Schema saved",
			context: {
				raw_bytes: stats.rawBytes,
				compressed_bytes: stats.compressedBytes,
			},
		});
	};

	const onCopyShareLink = async () => {
		const url = `${window.location.origin}${window.location.pathname}${window.location.hash}`;

		try {
			await navigator.clipboard.writeText(url);
			setMessage("Share link copied.");
			logEvent({
				level: "info",
				message: "Share link copied",
			});
		} catch {
			setMessage(
				"Copy failed. Save first, then copy manually from the address bar.",
			);
			logEvent({
				level: "warn",
				message: "Share link copy failed",
			});
		}
	};

	const onFormatSpec = () => {
		try {
			const parsed = parseSpecText(schemaText);
			const pretty = serializeSpec(parsed.doc, parsed.format);
			setSchemaText(pretty);
			setMessage(`${parsed.format.toUpperCase()} formatted.`);
			logEvent({
				level: "info",
				message: `${parsed.format.toUpperCase()} formatted`,
			});
		} catch (error) {
			const failure = error instanceof Error ? error.message : "Invalid schema";
			setMessage(`Format failed: ${failure}`);
			logEvent({
				level: "warn",
				message: "Schema formatting failed",
				context: { error: failure },
			});
		}
	};

	const onExportJson = () => {
		try {
			const parsed = parseSpecText(schemaText);
			const pretty = serializeSpec(parsed.doc, "json");
			const blob = new Blob([pretty], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "openapi.json";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			setMessage("Exported openapi.json.");
			logEvent({
				level: "info",
				message: "Schema exported as JSON",
			});
		} catch (error) {
			const failure = error instanceof Error ? error.message : "Invalid schema";
			setMessage(`Export failed: ${failure}`);
			logEvent({
				level: "warn",
				message: "Schema export failed",
				context: { error: failure },
			});
		}
	};

	const onExportYaml = () => {
		try {
			const parsed = parseSpecText(schemaText);
			const yamlText = serializeSpec(parsed.doc, "yaml");
			const blob = new Blob([yamlText], { type: "application/yaml" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "openapi.yaml";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			setMessage("Exported openapi.yaml.");
			logEvent({
				level: "info",
				message: "Schema exported as YAML",
			});
		} catch (error) {
			const failure = error instanceof Error ? error.message : "Invalid schema";
			setMessage(`Export failed: ${failure}`);
			logEvent({
				level: "warn",
				message: "Schema export as YAML failed",
				context: { error: failure },
			});
		}
	};

	const onImportJsonClick = () => {
		fileInputRef.current?.click();
	};

	const onImportFile: React.ChangeEventHandler<HTMLInputElement> = async (
		event,
	) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		const text = await file.text();

		try {
			const parsed = parseSpecText(text);
			const forcedFormat = detectFormatFromFileName(file.name);
			const targetFormat = forcedFormat ?? parsed.format;
			const pretty = serializeSpec(parsed.doc, targetFormat);
			setSchemaText(pretty);
			setParsedFormat(targetFormat);
			window.localStorage.setItem(LOCAL_STORAGE_SCHEMA_KEY, pretty);
			setMessage(`Imported ${file.name}.`);
			logEvent({
				level: "info",
				message: "Schema imported",
				context: { file_name: file.name, file_size: file.size },
			});
		} catch (error) {
			const failure = error instanceof Error ? error.message : "Invalid schema";
			setMessage(`Import failed: ${failure}`);
			logEvent({
				level: "warn",
				message: "Schema import failed",
				context: { error: failure, file_name: file.name },
			});
		} finally {
			event.target.value = "";
		}
	};

	return (
		<div className="app-shell">
			<header className="toolbar">
				<div className="left">
					<div className="toolbar-main toolbar-menu-wrap">
						<button
							type="button"
							className="menu-toggle"
							onClick={() => setIsMenuOpen((value) => !value)}
							aria-expanded={isMenuOpen}
							aria-label="Toggle actions menu"
							title="Actions menu"
						>
							<img
								src={
									themeMode === "dark"
										? menuDarkIcon
										: menuLightIcon
								}
								alt="Menu"
								className="menu-icon"
							/>
						</button>
						{isMenuOpen ? (
							<div className="toolbar-menu">
								<button
									onClick={() => {
										setIsEditorCollapsed((value) => !value);
										setIsMenuOpen(false);
									}}
									type="button"
								>
									{isEditorCollapsed ? "Show editor" : "Hide editor"}
								</button>
								<button
									onClick={() =>
										setEditorFontSize((size) =>
											Math.max(MIN_EDITOR_FONT_SIZE, size - 1),
										)
									}
									type="button"
								>
									Decrease editor font
								</button>
								<button
									onClick={() =>
										setEditorFontSize((size) =>
											Math.min(MAX_EDITOR_FONT_SIZE, size + 1),
										)
									}
									type="button"
								>
									Increase editor font
								</button>
								<button
									onClick={() => {
										onSave();
										setIsMenuOpen(false);
									}}
									type="button"
								>
									Save
								</button>
								<button
									onClick={async () => {
										await onCopyShareLink();
										setIsMenuOpen(false);
									}}
									type="button"
								>
									Copy share link
								</button>
								<button
									onClick={() => {
										onImportJsonClick();
										setIsMenuOpen(false);
									}}
									type="button"
								>
									Import file
								</button>
								<button
									onClick={() => {
										onExportJson();
										setIsMenuOpen(false);
									}}
									type="button"
								>
									Export JSON
								</button>
								<button
									onClick={() => {
										onExportYaml();
										setIsMenuOpen(false);
									}}
									type="button"
								>
									Export YAML
								</button>
								<button
									onClick={() => {
										onFormatSpec();
										setIsMenuOpen(false);
									}}
									type="button"
								>
									Format file
								</button>
							</div>
						) : null}
					</div>
					<div className="name">
						<img src={logoVector} alt="Janus" className="logo" />
						<p>Janus</p>
					</div>
				</div>
				<button
					type="button"
					className="theme-toggle"
					onClick={() =>
						setThemePreference(themeMode === "dark" ? "light" : "dark")
					}
					aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
					title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
				>
					<img
						src={themeMode === "dark" ? sunIcon : moonIcon}
						alt={themeMode === "dark" ? "Dark mode" : "Light mode"}
						className="theme-icon"
					/>
				</button>
				<input
					ref={fileInputRef}
					type="file"
					accept="application/json,.json,application/yaml,text/yaml,.yaml,.yml"
					onChange={onImportFile}
					className="hidden-input"
				/>
			</header>

			<div className="status-line">
				<span>{message}</span>
				<span>{parsedFormat.toUpperCase()}</span>
				<span>
					Size: {stats.rawBytes.toLocaleString()}/
					{stats.compressedBytes.toLocaleString()} B
				</span>
				{stats.tooLarge ? (
					<span className="warning">
						Large payload: some URLs may fail to open.
					</span>
				) : null}
			</div>

			{parseError ? (
				<div className="error-banner">Schema error: {parseError}</div>
			) : null}

			<main
				className={`split-view ${isEditorCollapsed ? "editor-collapsed" : ""}`}
			>
				{!isEditorCollapsed ? (
					<section className="pane pane-editor">
						<Suspense
							fallback={
								<div className="preview-placeholder">Loading editor...</div>
							}
						>
							<MonacoEditor
								height="100%"
								defaultLanguage="json"
								value={schemaText}
								onChange={(value) => setSchemaText(value ?? "")}
								onMount={(editor) => {
									editorRef.current = editor;
								}}
								theme={themeMode === "dark" ? "vs-dark" : "vs"}
								options={{
									minimap: { enabled: false },
									wordWrap: "on",
									tabSize: 2,
									automaticLayout: true,
									fontFamily:
										"'IBM Plex Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
									fontSize: editorFontSize,
								}}
							/>
						</Suspense>
					</section>
				) : null}
				<section className="pane pane-preview">
					{parsedSpec ? (
						specKind === "openapi" ? (
							<SwaggerUI
								spec={parsedSpec}
								supportedSubmitMethods={[]}
								docExpansion="list"
								defaultModelsExpandDepth={1}
							/>
						) : specKind === "asyncapi" ? (
							<AsyncApiPreview spec={parsedSpec} />
						) : (
							<div className="preview-placeholder">
								Unsupported schema type. Provide an OpenAPI or AsyncAPI
								document.
							</div>
						)
					) : (
						<div className="preview-placeholder">
							Provide valid JSON or YAML to render the OpenAPI or AsyncAPI
							preview.
						</div>
					)}
				</section>
			</main>
		</div>
	);
}

export default App;
