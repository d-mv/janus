import { Fragment } from "react";

type Props = { spec: unknown };
type Dict = Record<string, unknown>;

const asDict = (value: unknown): Dict =>
	value && typeof value === "object" ? (value as Dict) : {};

const asText = (value: unknown): string | null =>
	typeof value === "string" && value.trim().length > 0 ? value : null;

const renderJson = (value: unknown): string => JSON.stringify(value, null, 2);

function JsonBlock({ label, value }: { label: string; value: unknown }) {
	return (
		<details className="asyncapi-details">
			<summary>{label}</summary>
			<pre>{renderJson(value)}</pre>
		</details>
	);
}

function Section({
	title,
	empty,
	children,
}: {
	title: string;
	empty?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="asyncapi-section">
			<h3>{title}</h3>
			{children ?? <p className="asyncapi-muted">{empty ?? "None"}</p>}
		</section>
	);
}

export default function AsyncApiPreview({ spec }: Props) {
	const doc = asDict(spec);
	const info = asDict(doc.info);
	const title = asText(info.title) ?? "Untitled AsyncAPI";
	const version = asText(info.version) ?? "unknown";
	const asyncapiVersion = asText(doc.asyncapi) ?? "unknown";

	const servers = asDict(doc.servers);
	const channels = asDict(doc.channels);
	const operations = asDict(doc.operations);
	const components = asDict(doc.components);
	const componentMessages = asDict(components.messages);
	const componentSchemas = asDict(components.schemas);

	return (
		<div className="asyncapi-preview">
			<h2>{title}</h2>
			<p className="asyncapi-subtitle">
				AsyncAPI {asyncapiVersion} • API version {version}
			</p>
			{asText(info.description) ? (
				<p className="asyncapi-description">{asText(info.description)}</p>
			) : null}

			<Section title="Servers" empty="No servers defined.">
				{Object.keys(servers).length > 0 ? (
					<div className="asyncapi-list">
						{Object.entries(servers).map(([name, raw]) => {
							const server = asDict(raw);
							return (
								<article key={name} className="asyncapi-card">
									<h4>{name}</h4>
									<p className="asyncapi-row">
										<strong>URL:</strong> {asText(server.url) ?? "n/a"}
									</p>
									<p className="asyncapi-row">
										<strong>Protocol:</strong>{" "}
										{asText(server.protocol) ?? "n/a"}
									</p>
									{asText(server.description) ? (
										<p className="asyncapi-muted">{asText(server.description)}</p>
									) : null}
								</article>
							);
						})}
					</div>
				) : (
					<p className="asyncapi-muted">No servers defined.</p>
				)}
			</Section>

			<Section title="Channels" empty="No channels defined.">
				{Object.keys(channels).length > 0 ? (
					<div className="asyncapi-list">
						{Object.entries(channels).map(([name, raw]) => {
							const channel = asDict(raw);
							const publish = asDict(channel.publish);
							const subscribe = asDict(channel.subscribe);
							return (
								<article key={name} className="asyncapi-card">
									<h4>{name}</h4>
									{asText(channel.description) ? (
										<p className="asyncapi-muted">{asText(channel.description)}</p>
									) : null}
									{Object.keys(publish).length > 0 ? (
										<Fragment>
											<p className="asyncapi-row">
												<strong>Publish:</strong>{" "}
												{asText(publish.summary) ?? asText(publish.operationId) ?? "yes"}
											</p>
											<JsonBlock label="Publish operation" value={publish} />
										</Fragment>
									) : null}
									{Object.keys(subscribe).length > 0 ? (
										<Fragment>
											<p className="asyncapi-row">
												<strong>Subscribe:</strong>{" "}
												{asText(subscribe.summary) ??
													asText(subscribe.operationId) ??
													"yes"}
											</p>
											<JsonBlock label="Subscribe operation" value={subscribe} />
										</Fragment>
									) : null}
									{Object.keys(asDict(channel.messages)).length > 0 ? (
										<JsonBlock label="Channel messages" value={channel.messages} />
									) : null}
								</article>
							);
						})}
					</div>
				) : (
					<p className="asyncapi-muted">No channels defined.</p>
				)}
			</Section>

			<Section title="Operations" empty="No top-level operations defined.">
				{Object.keys(operations).length > 0 ? (
					<div className="asyncapi-list">
						{Object.entries(operations).map(([name, raw]) => {
							const operation = asDict(raw);
							return (
								<article key={name} className="asyncapi-card">
									<h4>{name}</h4>
									<p className="asyncapi-row">
										<strong>Action:</strong> {asText(operation.action) ?? "n/a"}
									</p>
									<p className="asyncapi-row">
										<strong>Channel:</strong>{" "}
										{asText(asDict(operation.channel).$ref) ??
											asText(operation.channel) ??
											"n/a"}
									</p>
									{asText(operation.summary) ? (
										<p className="asyncapi-muted">{asText(operation.summary)}</p>
									) : null}
									<JsonBlock label="Operation details" value={operation} />
								</article>
							);
						})}
					</div>
				) : (
					<p className="asyncapi-muted">No top-level operations defined.</p>
				)}
			</Section>

			<Section title="Components" empty="No components defined.">
				{Object.keys(components).length > 0 ? (
					<div className="asyncapi-list">
						{Object.keys(componentMessages).length > 0 ? (
							<article className="asyncapi-card">
								<h4>Messages</h4>
								<JsonBlock label="Component messages" value={componentMessages} />
							</article>
						) : null}
						{Object.keys(componentSchemas).length > 0 ? (
							<article className="asyncapi-card">
								<h4>Schemas</h4>
								<JsonBlock label="Component schemas" value={componentSchemas} />
							</article>
						) : null}
						{Object.keys(components).length > 0 ? (
							<article className="asyncapi-card">
								<h4>Raw components</h4>
								<JsonBlock label="All components" value={components} />
							</article>
						) : null}
					</div>
				) : (
					<p className="asyncapi-muted">No components defined.</p>
				)}
			</Section>
		</div>
	);
}
