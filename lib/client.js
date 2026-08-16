window.__ModuleLoader__.load({
	id: "@nanmicoder/dsh-agent-teams",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom_client = require("react-dom/client");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/client/activity-model.js
		/** Pure relationship projections used by the AgentTeams activity panel. */
		/**
		* Whether an expanded activity panel still belongs to the current session.
		*
		* The panel is mounted through a body portal, so React does not remount it
		* when the conversation route changes. Ownership keeps an expanded panel
		* from leaking onto the new-session screen (or another conversation) while
		* its local open state is being reset.
		*/
		function activityPanelExpandedForSession(open, owner, current) {
			return open && owner !== void 0 && owner === current;
		}
		/** Group tasks by their precomputed dependency depth. */
		function taskStages(tasks) {
			const byDepth = /* @__PURE__ */ new Map();
			for (const task of tasks) {
				const depth = Number.isFinite(task.depth) ? Math.max(0, Math.floor(task.depth)) : 0;
				const stage = byDepth.get(depth) ?? [];
				stage.push(task);
				byDepth.set(depth, stage);
			}
			return [...byDepth.entries()].sort(([left], [right]) => left - right).map(([depth, stageTasks]) => ({
				depth,
				tasks: stageTasks.slice().sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true }))
			}));
		}
		/**
		* Return the complete upstream/downstream chain around one task.
		*
		* Traversal uses both dependency directions and remains cycle-safe, so the UI
		* can highlight every handoff related to the focused task even if malformed
		* durable data contains a cycle.
		*/
		function relatedTaskIds(taskId, tasks) {
			const byId = new Map(tasks.map((task) => [task.id, task]));
			if (!byId.has(taskId)) return /* @__PURE__ */ new Set();
			const dependents = /* @__PURE__ */ new Map();
			for (const task of tasks) for (const dependency of task.dependencies) {
				const targets = dependents.get(dependency) ?? [];
				targets.push(task.id);
				dependents.set(dependency, targets);
			}
			const related = /* @__PURE__ */ new Set();
			const upstreamSeen = /* @__PURE__ */ new Set();
			const downstreamSeen = /* @__PURE__ */ new Set();
			const visitUpstream = (id) => {
				if (upstreamSeen.has(id)) return;
				upstreamSeen.add(id);
				related.add(id);
				for (const dependency of byId.get(id)?.dependencies ?? []) visitUpstream(dependency);
			};
			const visitDownstream = (id) => {
				if (downstreamSeen.has(id)) return;
				downstreamSeen.add(id);
				related.add(id);
				for (const dependent of dependents.get(id) ?? []) visitDownstream(dependent);
			};
			visitUpstream(taskId);
			visitDownstream(taskId);
			return related;
		}
		//#endregion
		//#region lib/client/artwork.js
		/**
		* Shared whale artwork lookup for the activity panel and the conversation
		* card: role keywords map to the packaged role images; the captain always
		* uses the lead whale.
		* @module dsh-agent-teams/client/artwork
		*/
		/** Artwork route prefix served by the plugin host half. */
		const ART_BASE = "/plugins/dsh-agent-teams/assets/";
		/** Whale role artwork per role keyword. */
		const ROLE_ART = [
			[/resear|analys|investig|explor|data|study|研究|分析|数据|调查|探索|调研/, "researcher.png"],
			[/engineer|dev\b|server|backend|\bapi\b|runtime|watcher|contract|工程|后端|服务|接口|开发|代码|编程/, "engineer.png"],
			[/\bqa\b|test|verif|quality|测试|质量/, "qa-engineer.png"],
			[/design|\bui\b|\bux\b|front|theme|accessib|设计|前端|主题/, "designer.png"],
			[/secur|audit|risk|threat|review|安全|审计|审查|风险/, "security-reviewer.png"],
			[/docs|writer|product|spec|coordin|撰写|文案|写作|文档|协调/, "docs-coordinator.png"],
			[/release|\bbuild\b|deploy|\bops\b|\bci\b|ship|发布|构建|部署/, "engineer.png"]
		];
		/** Captain artwork (always the lead whale). */
		const LEAD_ART = `${ART_BASE}team-lead.png`;
		/**
		* Fallback member artwork when no role keyword matches. Always an original
		* whale glyph — never a name initial.
		*/
		const DEFAULT_MEMBER_ART = `${ART_BASE}researcher.png`;
		/** Status action artwork per member activity. */
		const ACTION_ART = {
			working: `${ART_BASE}action-working.png`,
			idle: `${ART_BASE}action-sleeping.png`,
			unknown: `${ART_BASE}action-thinking.png`
		};
		/**
		* Member artwork URL. Role keywords map to the packaged role images; an
		* unmatched member gets the default whale artwork.
		* @param name - the member's display name.
		* @param role - the member's role text.
		* @returns the artwork URL.
		*/
		function memberArtUrl(name, role) {
			const identity = `${name} ${role}`.toLowerCase();
			for (const [pattern, art] of ROLE_ART) if (pattern.test(identity)) return `${ART_BASE}${art}`;
			return DEFAULT_MEMBER_ART;
		}
		//#endregion
		//#region \0dsh-css:D:\github\dsh-agent-teams\src\client\AgentTeamsCard.module.css.mjs
		const css$2 = ".A42-3q_root{box-sizing:border-box;border:1px solid var(--dsw-alias-line-normal);background:var(--dsw-alias-bg-module-platform);border-radius:10px;flex-direction:column;gap:8px;width:100%;min-width:0;padding:10px 12px;display:flex}.A42-3q_head{align-items:center;gap:8px;min-width:0;display:flex}.A42-3q_leadAvatar{border:1px solid var(--dsw-alias-line-strong);object-fit:cover;background:#0b1d33;border-radius:50%;flex:none;width:24px;height:24px}.A42-3q_teamName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:0 auto;font-size:13px;font-weight:600;line-height:20px;overflow:hidden}.A42-3q_memberCount{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;margin-left:auto;font-size:11px;line-height:16px}.A42-3q_panelButton{border:1px solid var(--dsw-alias-line-strong);background:var(--dsw-alias-bg-module);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;flex:none;padding:2px 8px;font-size:10.5px;font-weight:600;line-height:16px;transition:border-color .12s,color .12s}.A42-3q_panelButton:hover{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}.A42-3q_panelButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.A42-3q_members{flex-wrap:wrap;gap:6px;min-width:0;display:flex}.A42-3q_member{border:1px solid var(--dsw-alias-line-normal);background:var(--dsw-alias-bg-module);max-width:160px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:5px;padding:3px 8px 3px 3px;font-size:11px;font-weight:500;line-height:16px;transition:border-color .12s,background-color .12s;display:inline-flex}.A42-3q_member:hover{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-fill-neutral)}.A42-3q_member:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.A42-3q_memberArt{border:1px solid var(--dsw-alias-line-strong);object-fit:cover;background:#0b1d33;border-radius:50%;width:20px;height:20px}.A42-3q_memberInitial{background:var(--dsw-alias-bg-fill-business);width:20px;height:20px;color:var(--dsw-alias-label-on-fill);border-radius:50%;justify-content:center;align-items:center;font-size:10px;font-weight:600;line-height:20px;display:inline-flex}.A42-3q_memberName{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}";
		const tagId$2 = "@nanmicoder/dsh-agent-teams/AgentTeamsCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-agent-teams";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var AgentTeamsCard_module_css_default = {
			"head": "A42-3q_head",
			"leadAvatar": "A42-3q_leadAvatar",
			"member": "A42-3q_member",
			"memberArt": "A42-3q_memberArt",
			"memberCount": "A42-3q_memberCount",
			"memberInitial": "A42-3q_memberInitial",
			"memberName": "A42-3q_memberName",
			"members": "A42-3q_members",
			"panelButton": "A42-3q_panelButton",
			"root": "A42-3q_root",
			"teamName": "A42-3q_teamName"
		};
		//#endregion
		//#region lib/client/AgentTeamsCard.js
		/**
		* AgentTeams conversation card: the lightweight in-conversation summary for
		* one team — the captain's whale avatar and name, the member roster as
		* clickable whale avatars (opening the member's subagent transcript), and
		* an "activity panel" button that re-activates the top-right floater.
		*
		* The floater and this card share the `agent-teams:open-panel` window event
		* so the card can summon the panel even after it was closed (or when an old
		* session is re-opened for review).
		* @module dsh-agent-teams/client/card
		*/
		/** Window event name the floater listens for to open itself. */
		const OPEN_PANEL_EVENT = "agent-teams:open-panel";
		/** Re-activate the top-right activity panel, carrying this team's summary
		* so the panel can show it even when the team no longer exists on disk
		* (historical session review). */
		function openActivityPanel(data) {
			window.dispatchEvent(new CustomEvent(OPEN_PANEL_EVENT, { detail: {
				teamId: data.teamId,
				captainSessionId: data.captainSessionId,
				teamName: data.teamName,
				members: data.members
			} }));
		}
		/** Render one durable team as a compact conversation card. */
		function AgentTeamsCard({ node, openSession, currentSessionId }) {
			const data = node.data;
			const owner = data.captainSessionId || currentSessionId() || "";
			const [snapshot, setSnapshot] = (0, react.useState)();
			(0, react.useEffect)(() => {
				let cancelled = false;
				const tick = async () => {
					for (const url of ["/plugins/dsh-agent-teams/state", "/plugins/dsh-agent-teams/state?archived=1"]) try {
						const response = await fetch(url, { cache: "no-store" });
						if (!response.ok) continue;
						const body = await response.json();
						const found = Array.isArray(body.teams) ? body.teams.find((team) => team.teamId === data.teamId && (owner === "" || team.captainSessionId === owner)) : void 0;
						if (found !== void 0) {
							if (!cancelled) setSnapshot(found);
							return;
						}
					} catch {}
				};
				tick();
				const timer = setInterval(() => {
					tick();
				}, 1500);
				return () => {
					cancelled = true;
					clearInterval(timer);
				};
			}, [data.teamId, owner]);
			const resolved = (0, react.useMemo)(() => ({
				...data,
				captainSessionId: snapshot?.captainSessionId ?? owner,
				teamName: snapshot?.name ?? data.teamName,
				members: snapshot?.members.map((member) => ({
					id: member.id,
					name: member.name,
					role: member.role
				})) ?? data.members
			}), [
				data,
				owner,
				snapshot
			]);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: AgentTeamsCard_module_css_default.root,
				"data-agent-teams-card": true,
				"data-team-id": resolved.teamId,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: AgentTeamsCard_module_css_default.head,
					children: [
						(0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.leadAvatar,
							src: LEAD_ART,
							alt: "",
							"aria-hidden": true
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.teamName,
							title: resolved.teamName,
							children: resolved.teamName
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: AgentTeamsCard_module_css_default.memberCount,
							children: [resolved.members.length, " 名成员"]
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: AgentTeamsCard_module_css_default.panelButton,
							onClick: () => {
								openActivityPanel(resolved);
							},
							"aria-label": "打开活动面板",
							title: "打开活动面板",
							children: "活动面板"
						})
					]
				}), resolved.members.length > 0 && (0, react_jsx_runtime.jsx)("div", {
					className: AgentTeamsCard_module_css_default.members,
					children: resolved.members.map((member) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: AgentTeamsCard_module_css_default.member,
						onClick: () => {
							if (member.id !== "") openSession(member.id);
						},
						title: member.role === "" ? member.name : `${member.name} · ${member.role}`,
						children: [(0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.memberArt,
							src: memberArtUrl(member.name, member.role),
							alt: "",
							"aria-hidden": true
						}), (0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberName,
							children: member.name
						})]
					}, member.id))
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\github\dsh-agent-teams\src\client\ActivityPanel.module.css.mjs
		const css$1 = "html{--agent-teams-panel-width:388px;--agent-teams-panel-right:calc(18px + var(--dsh-sidebar-width,0px));--agent-teams-panel-gap:14px;--agent-teams-panel-shift:calc(var(--agent-teams-panel-width) + 18px + var(--agent-teams-panel-gap))}html[data-agent-teams-panel-open] [data-phase=active]{box-sizing:border-box;padding-right:var(--agent-teams-panel-shift)}[data-phase=active]{will-change:padding-right;transition:padding-right .36s cubic-bezier(.22,1,.36,1)}.Q79w0G_badge{top:64px;right:var(--agent-teams-panel-right);z-index:2147483000;box-sizing:border-box;border:1px solid var(--dsw-alias-line-normal);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 92%, transparent);backdrop-filter:blur(16px);height:34px;box-shadow:0 8px 28px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:7px;padding:0 12px;font-size:12px;font-weight:600;line-height:20px;transition:border-color .15s,transform .12s;display:inline-flex;position:fixed}.Q79w0G_badge:hover{border-color:var(--dsw-alias-line-strong);transform:translateY(-1px)}.Q79w0G_badge:active{transform:translateY(0)scale(.98)}.Q79w0G_badge:focus-visible,.Q79w0G_closeButton:focus-visible,.Q79w0G_memberRow:focus-visible,.Q79w0G_taskNode:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.Q79w0G_badgeDot,.Q79w0G_panelDot{background:var(--dsw-alias-label-tertiary);border-radius:50%;width:7px;height:7px}.Q79w0G_badgeDot[data-busy=true],.Q79w0G_panelDot[data-busy=true]{background:var(--dsw-alias-state-business-primary);animation:1.25s ease-in-out infinite Q79w0G_agentTeamsPulse}.Q79w0G_badgeCount,.Q79w0G_memberCount,.Q79w0G_teamStats,.Q79w0G_stageLabel,.Q79w0G_taskId{font-variant-numeric:tabular-nums}.Q79w0G_panel{top:64px;right:var(--agent-teams-panel-right);z-index:2147483000;width:min(var(--agent-teams-panel-width), calc(100vw - 24px));box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-line-strong) 58%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 95%, transparent);backdrop-filter:blur(20px)saturate(1.08);max-height:70dvh;box-shadow:0 12px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent), 0 32px 72px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);border-radius:16px;flex-direction:column;animation:.18s ease-out Q79w0G_agentTeamsPanelIn;display:flex;position:fixed;overflow:hidden}@keyframes Q79w0G_agentTeamsPanelIn{0%{opacity:0;transform:translateY(-6px)scale(.99)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes Q79w0G_agentTeamsPulse{0%,to{opacity:.42}50%{opacity:1}}.Q79w0G_panelHead{border-bottom:1px solid var(--dsw-alias-line-normal);flex:none;justify-content:space-between;align-items:center;min-height:44px;padding:0 14px 0 16px;display:flex}.Q79w0G_panelTitle{color:var(--dsw-alias-label-primary);align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:20px;display:inline-flex}.Q79w0G_closeButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:7px;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,transform .12s;display:inline-flex}.Q79w0G_closeButton:hover{background:var(--dsw-alias-bg-fill-neutral);color:var(--dsw-alias-label-primary)}.Q79w0G_closeButton:active{transform:scale(.94)}.Q79w0G_teams{overscroll-behavior:contain;flex-direction:column;min-height:0;display:flex;overflow-y:auto}.Q79w0G_team{border-bottom:1px solid var(--dsw-alias-line-normal);flex-direction:column;gap:12px;padding:12px 14px 16px;display:flex}.Q79w0G_team:last-child{border-bottom:0}.Q79w0G_teamHead{align-items:center;gap:10px;min-width:0;display:flex}.Q79w0G_teamName{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;font-weight:600;line-height:18px;overflow:hidden}.Q79w0G_teamStats{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;gap:8px;font-size:10.5px;line-height:16px;display:inline-flex}.Q79w0G_sectionHead{justify-content:space-between;align-items:center;gap:8px;min-width:0;display:flex}.Q79w0G_sectionTitle{color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;font-size:11px;font-weight:600;line-height:16px;display:inline-flex}.Q79w0G_sectionHint{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.Q79w0G_delegationSection{min-width:0}.Q79w0G_captainNode{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, var(--dsw-alias-line-normal));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-module));border-radius:10px;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:9px;min-height:48px;padding:8px 10px;display:grid}.Q79w0G_captainAvatar,.Q79w0G_memberAvatar{flex:none;justify-content:center;align-items:center;display:inline-flex;position:relative}.Q79w0G_captainAvatar{width:36px;height:36px}.Q79w0G_leadAvatar,.Q79w0G_memberArt,.Q79w0G_memberInitial{box-sizing:border-box;border:1px solid var(--dsw-alias-line-strong);object-fit:cover;background:#0b1d33;border-radius:50%;width:34px;height:34px}.Q79w0G_captainInfo,.Q79w0G_memberInfo{flex-direction:column;min-width:0;display:flex}.Q79w0G_captainInfo{gap:2px}.Q79w0G_captainLine,.Q79w0G_memberLine{align-items:center;gap:6px;min-width:0;display:flex}.Q79w0G_captainName,.Q79w0G_memberName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600;line-height:18px;overflow:hidden}.Q79w0G_captainRole,.Q79w0G_memberRole{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.Q79w0G_captainSummary,.Q79w0G_memberStatusLine{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;line-height:15px;overflow:hidden}.Q79w0G_captainState,.Q79w0G_memberState{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;align-items:center;gap:5px;font-size:10px;font-weight:500;line-height:15px;display:inline-flex}.Q79w0G_captainState[data-busy=true],.Q79w0G_memberState[data-activity=working]{color:var(--dsw-alias-state-business-primary)}.Q79w0G_delegationTree{flex-direction:column;gap:2px;margin-left:18px;padding:9px 0 0 20px;display:flex;position:relative}.Q79w0G_delegationTree:before{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-line-normal));content:\"\";width:1px;position:absolute;top:0;bottom:22px;left:0}.Q79w0G_memberBlock{flex-direction:column;min-width:0;padding:3px 0 7px;display:flex;position:relative}.Q79w0G_memberBranch{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-line-normal));width:20px;height:1px;display:block;position:absolute;top:23px;right:100%}.Q79w0G_memberBranch:before{background:var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;width:5px;height:5px;position:absolute;top:-2px;right:-1px}.Q79w0G_memberRow{box-sizing:border-box;width:100%;min-width:0;min-height:44px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 6px;transition:background-color .12s,transform .12s;display:grid}.Q79w0G_memberRow:hover,.Q79w0G_memberRow[data-activity=working]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-module))}.Q79w0G_memberRow:active{transform:scale(.995)}.Q79w0G_memberAvatar{width:34px;height:34px}.Q79w0G_memberAvatar[data-unread=true]:after{border:1px solid var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;animation:1.5s ease-out infinite Q79w0G_agentTeamsRing;position:absolute;inset:-3px}@keyframes Q79w0G_agentTeamsRing{0%{opacity:.82;transform:scale(.94)}75%,to{opacity:0;transform:scale(1.18)}}.Q79w0G_memberInitial{color:var(--dsw-alias-label-on-fill);justify-content:center;align-items:center;font-size:14px;font-weight:600;line-height:20px;display:inline-flex}.Q79w0G_stateArt{box-sizing:border-box;border:2px solid var(--dsw-alias-bg-module-platform);object-fit:cover;background:#0b1d33;border-radius:50%;width:19px;height:19px;position:absolute;bottom:-4px;right:-4px}.Q79w0G_stateArt[data-activity=working]{animation:2.4s ease-in-out infinite Q79w0G_agentTeamsFloat}.Q79w0G_stateArt[data-activity=idle]{animation:4.2s ease-in-out infinite Q79w0G_agentTeamsBreathe}.Q79w0G_stateArt[data-activity=unknown]{animation:2.8s ease-in-out infinite Q79w0G_agentTeamsThink}@keyframes Q79w0G_agentTeamsFloat{0%,to{transform:translateY(0)rotate(-4deg)}50%{transform:translateY(-2px)rotate(4deg)}}@keyframes Q79w0G_agentTeamsBreathe{0%,to{opacity:.82;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}@keyframes Q79w0G_agentTeamsThink{0%,to{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}.Q79w0G_memberState{margin-left:auto}.Q79w0G_memberCount{color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:16px}.Q79w0G_assignmentLine{align-items:center;gap:7px;min-width:0;padding:0 6px 0 52px;display:flex}.Q79w0G_assignmentLabel{color:var(--dsw-alias-label-tertiary);flex:none;font-size:9.5px;line-height:14px}.Q79w0G_assignmentTasks{flex-wrap:wrap;flex:1;gap:4px;min-width:0;display:flex}.Q79w0G_assignmentChip{background:var(--dsw-alias-bg-fill-neutral);min-height:16px;color:var(--dsw-alias-label-secondary);border-radius:4px;align-items:center;padding:0 5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;font-weight:600;line-height:14px;display:inline-flex}.Q79w0G_assignmentChip[data-state=running]{background:var(--dsw-alias-bg-fill-business);color:var(--dsw-alias-label-on-fill)}.Q79w0G_assignmentChip[data-state=completed]{background:var(--dsw-alias-bg-fill-success);color:var(--dsw-alias-label-on-fill)}.Q79w0G_assignmentChip[data-state=blocked]{background:var(--dsw-alias-bg-fill-warning);color:var(--dsw-alias-label-on-fill)}.Q79w0G_assignmentChip[data-state=failed]{background:var(--dsw-alias-bg-fill-danger);color:var(--dsw-alias-label-on-fill)}.Q79w0G_assignmentChip[data-state=cancelled]{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}.Q79w0G_unreadPill{color:var(--dsw-alias-state-business-primary);white-space:nowrap;flex:none;font-size:9.5px;font-weight:600;line-height:14px}.Q79w0G_taskEmpty{color:var(--dsw-alias-label-tertiary);font-size:9.5px;line-height:14px}.Q79w0G_dependencySection{border-top:1px solid var(--dsw-alias-line-normal);flex-direction:column;gap:7px;min-width:0;padding-top:10px;display:flex}.Q79w0G_stageFlow{scrollbar-width:thin;align-items:stretch;gap:0;min-width:0;padding:1px 1px 5px;display:flex;overflow-x:auto}.Q79w0G_stageGroup{flex:1 0 126px;min-width:126px;display:flex;position:relative}.Q79w0G_stageConnector{width:22px;height:14px;color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;margin-top:0;display:flex}.Q79w0G_stageLine{background:var(--dsw-alias-line-strong);flex:1;height:1px;display:block}.Q79w0G_stageColumn{flex-direction:column;flex:1;gap:5px;min-width:0;display:flex}.Q79w0G_stageLabel{color:var(--dsw-alias-label-tertiary);justify-content:space-between;align-items:center;gap:6px;padding:0 2px;font-size:9.5px;font-weight:600;line-height:14px;display:flex}.Q79w0G_stageLabel span{background:var(--dsw-alias-bg-fill-neutral);border-radius:4px;justify-content:center;align-items:center;min-width:14px;height:14px;font-size:8.5px;display:inline-flex}.Q79w0G_stageTasks{flex-direction:column;gap:5px;display:flex}.Q79w0G_taskNode{box-sizing:border-box;border:1px solid var(--dsw-alias-line-normal);background:var(--dsw-alias-bg-module);min-width:0;min-height:72px;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;border-radius:8px;flex-direction:column;gap:4px;padding:7px 8px;transition:border-color .14s,opacity .14s,transform .12s,background-color .14s;display:flex}.Q79w0G_taskNode:hover,.Q79w0G_taskNode[data-focused=true]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-module));transform:translateY(-1px)}.Q79w0G_taskNode[data-dimmed=true]{opacity:.34}.Q79w0G_taskNode[data-state=completed]{border-color:color-mix(in srgb, var(--dsw-alias-state-success) 48%, var(--dsw-alias-line-normal))}.Q79w0G_taskNode[data-state=blocked]{border-color:color-mix(in srgb, var(--dsw-alias-state-warning) 52%, var(--dsw-alias-line-normal))}.Q79w0G_taskNode[data-state=failed]{border-color:color-mix(in srgb, var(--dsw-alias-state-danger) 56%, var(--dsw-alias-line-normal))}.Q79w0G_taskNodeHead,.Q79w0G_taskRoute{justify-content:space-between;align-items:center;gap:5px;min-width:0;display:flex}.Q79w0G_taskId{color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;font-weight:700}.Q79w0G_taskBadge{background:var(--dsw-alias-bg-fill-neutral);min-height:14px;color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;align-items:center;padding:0 4px;font-size:8.5px;font-weight:600;line-height:13px;display:inline-flex}.Q79w0G_taskBadge[data-state=running]{background:var(--dsw-alias-bg-fill-business);color:var(--dsw-alias-label-on-fill)}.Q79w0G_taskBadge[data-state=completed]{background:var(--dsw-alias-bg-fill-success);color:var(--dsw-alias-label-on-fill)}.Q79w0G_taskBadge[data-state=blocked]{background:var(--dsw-alias-bg-fill-warning);color:var(--dsw-alias-label-on-fill)}.Q79w0G_taskBadge[data-state=failed]{background:var(--dsw-alias-bg-fill-danger);color:var(--dsw-alias-label-on-fill)}.Q79w0G_taskBadge[data-state=cancelled]{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}.Q79w0G_taskSubject{min-height:30px;color:var(--dsw-alias-label-primary);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:10.5px;font-weight:500;line-height:15px;display:-webkit-box;overflow:hidden}.Q79w0G_taskRoute{color:var(--dsw-alias-label-tertiary);margin-top:auto;font-size:8.5px;line-height:13px}.Q79w0G_taskOwner,.Q79w0G_taskDeps{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.Q79w0G_taskOwner{max-width:48%;color:var(--dsw-alias-label-secondary);font-weight:600}.Q79w0G_taskDeps{text-align:right;flex:1}.Q79w0G_taskStart{color:var(--dsw-alias-label-tertiary)}.Q79w0G_unclaimed,.Q79w0G_inbox{border-top:1px solid var(--dsw-alias-line-normal);flex-direction:column;gap:5px;min-width:0;padding-top:10px;display:flex}.Q79w0G_unclaimedTitle{color:var(--dsw-alias-label-secondary);font-size:10.5px;font-weight:600;line-height:15px}.Q79w0G_inboxRow{border-radius:6px;grid-template-columns:112px minmax(0,1fr);align-items:center;gap:8px;min-width:0;min-height:24px;padding:2px 5px;display:grid}.Q79w0G_inboxRow:hover{background:var(--dsw-alias-bg-module)}.Q79w0G_inboxRoute{min-width:0;color:var(--dsw-alias-state-business-primary);text-overflow:ellipsis;white-space:nowrap;align-items:center;gap:3px;font-size:9.5px;font-weight:600;line-height:14px;display:inline-flex;overflow:hidden}.Q79w0G_inboxContent{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.Q79w0G_emptyHint{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:11px;line-height:16px}.Q79w0G_team[data-historic],.Q79w0G_archivedWrap{opacity:.82}.Q79w0G_historicPill{background:var(--dsw-alias-bg-fill-neutral);color:var(--dsw-alias-label-tertiary);border-radius:4px;flex:none;margin-left:auto;padding:1px 7px;font-size:9.5px;font-weight:600;line-height:15px}.Q79w0G_members{flex-direction:column;gap:3px;display:flex}.Q79w0G_archivedWrap:before{color:var(--dsw-alias-label-tertiary);content:\"已结束 · 历史归档\";padding:5px 14px 0;font-size:9.5px;font-weight:600;line-height:14px;display:block}@media (prefers-reduced-motion:reduce){[data-phase=active],.Q79w0G_panel,.Q79w0G_badge,.Q79w0G_badgeDot,.Q79w0G_panelDot,.Q79w0G_stateArt,.Q79w0G_memberAvatar[data-unread=true]:after{transition:none;animation:none}}@media (width<=960px){html{--agent-teams-main-shift:0px}html[data-agent-teams-panel-open] [data-phase=active]{padding-right:0}}@media (width<=640px){html{--agent-teams-panel-right:calc(10px + var(--dsh-sidebar-width,0px))}.Q79w0G_panel{width:auto;max-height:calc(100dvh - 68px);top:56px;left:10px}.Q79w0G_badge{top:56px}.Q79w0G_teamStats span[data-stat=messages]{display:none}.Q79w0G_captainNode{grid-template-columns:38px minmax(0,1fr)}.Q79w0G_captainState{display:none}.Q79w0G_delegationTree{margin-left:12px;padding-left:15px}.Q79w0G_memberBranch{width:15px}.Q79w0G_assignmentLine{padding-left:45px}}";
		const tagId$1 = "@nanmicoder/dsh-agent-teams/ActivityPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-agent-teams";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ActivityPanel_module_css_default = {
			"agentTeamsBreathe": "Q79w0G_agentTeamsBreathe",
			"agentTeamsFloat": "Q79w0G_agentTeamsFloat",
			"agentTeamsPanelIn": "Q79w0G_agentTeamsPanelIn",
			"agentTeamsPulse": "Q79w0G_agentTeamsPulse",
			"agentTeamsRing": "Q79w0G_agentTeamsRing",
			"agentTeamsThink": "Q79w0G_agentTeamsThink",
			"archivedWrap": "Q79w0G_archivedWrap",
			"assignmentChip": "Q79w0G_assignmentChip",
			"assignmentLabel": "Q79w0G_assignmentLabel",
			"assignmentLine": "Q79w0G_assignmentLine",
			"assignmentTasks": "Q79w0G_assignmentTasks",
			"badge": "Q79w0G_badge",
			"badgeCount": "Q79w0G_badgeCount",
			"badgeDot": "Q79w0G_badgeDot",
			"captainAvatar": "Q79w0G_captainAvatar",
			"captainInfo": "Q79w0G_captainInfo",
			"captainLine": "Q79w0G_captainLine",
			"captainName": "Q79w0G_captainName",
			"captainNode": "Q79w0G_captainNode",
			"captainRole": "Q79w0G_captainRole",
			"captainState": "Q79w0G_captainState",
			"captainSummary": "Q79w0G_captainSummary",
			"closeButton": "Q79w0G_closeButton",
			"delegationSection": "Q79w0G_delegationSection",
			"delegationTree": "Q79w0G_delegationTree",
			"dependencySection": "Q79w0G_dependencySection",
			"emptyHint": "Q79w0G_emptyHint",
			"historicPill": "Q79w0G_historicPill",
			"inbox": "Q79w0G_inbox",
			"inboxContent": "Q79w0G_inboxContent",
			"inboxRoute": "Q79w0G_inboxRoute",
			"inboxRow": "Q79w0G_inboxRow",
			"leadAvatar": "Q79w0G_leadAvatar",
			"memberArt": "Q79w0G_memberArt",
			"memberAvatar": "Q79w0G_memberAvatar",
			"memberBlock": "Q79w0G_memberBlock",
			"memberBranch": "Q79w0G_memberBranch",
			"memberCount": "Q79w0G_memberCount",
			"memberInfo": "Q79w0G_memberInfo",
			"memberInitial": "Q79w0G_memberInitial",
			"memberLine": "Q79w0G_memberLine",
			"memberName": "Q79w0G_memberName",
			"memberRole": "Q79w0G_memberRole",
			"memberRow": "Q79w0G_memberRow",
			"memberState": "Q79w0G_memberState",
			"memberStatusLine": "Q79w0G_memberStatusLine",
			"members": "Q79w0G_members",
			"panel": "Q79w0G_panel",
			"panelDot": "Q79w0G_panelDot",
			"panelHead": "Q79w0G_panelHead",
			"panelTitle": "Q79w0G_panelTitle",
			"sectionHead": "Q79w0G_sectionHead",
			"sectionHint": "Q79w0G_sectionHint",
			"sectionTitle": "Q79w0G_sectionTitle",
			"stageColumn": "Q79w0G_stageColumn",
			"stageConnector": "Q79w0G_stageConnector",
			"stageFlow": "Q79w0G_stageFlow",
			"stageGroup": "Q79w0G_stageGroup",
			"stageLabel": "Q79w0G_stageLabel",
			"stageLine": "Q79w0G_stageLine",
			"stageTasks": "Q79w0G_stageTasks",
			"stateArt": "Q79w0G_stateArt",
			"taskBadge": "Q79w0G_taskBadge",
			"taskDeps": "Q79w0G_taskDeps",
			"taskEmpty": "Q79w0G_taskEmpty",
			"taskId": "Q79w0G_taskId",
			"taskNode": "Q79w0G_taskNode",
			"taskNodeHead": "Q79w0G_taskNodeHead",
			"taskOwner": "Q79w0G_taskOwner",
			"taskRoute": "Q79w0G_taskRoute",
			"taskStart": "Q79w0G_taskStart",
			"taskSubject": "Q79w0G_taskSubject",
			"team": "Q79w0G_team",
			"teamHead": "Q79w0G_teamHead",
			"teamName": "Q79w0G_teamName",
			"teamStats": "Q79w0G_teamStats",
			"teams": "Q79w0G_teams",
			"unclaimed": "Q79w0G_unclaimed",
			"unclaimedTitle": "Q79w0G_unclaimedTitle",
			"unreadPill": "Q79w0G_unreadPill"
		};
		//#endregion
		//#region lib/client/ActivityPanel.js
		/**
		* AgentTeams activity panel: the top-right floater monitoring every team.
		*
		* Modeled on the Claude Code desktop SessionActivityPanel: a fixed glass
		* panel at the top-right corner. On wide viewports it cooperatively makes the
		* conversation column yield space; narrow viewports keep overlay mode. It
		* polls the host `/plugins/dsh-agent-teams/state` route for
		* server-side snapshots (durable files + live subagent activity), with a
		* collapsed badge that auto-expands once when activity appears. Archived
		* teams stay available for the owning conversation after live work ends.
		*
		* The floater mounts through a body portal (no top-right slot exists in the
		* web shell); it is not a conversation node — the in-conversation panel was
		* removed in favor of this always-available monitor.
		* @module dsh-agent-teams/client/activity
		*/
		/** Poll cadence for the host snapshot route. */
		const POLL_MS = 1e3;
		/** Grace before the panel collapses once no team remains. */
		const AUTOCLOSE_GRACE_MS = 2e3;
		/**
		* Page-settle window after mount: activity restored on page load only shows
		* the collapsed badge, so the panel never yanks the conversation column
		* right after load. New activity after this window auto-expands as usual.
		*/
		const AUTO_OPEN_SETTLE_MS = 4e3;
		/** Host route serving team snapshots. */
		const STATE_URL = "/plugins/dsh-agent-teams/state";
		/** Root marker shared with the panel CSS while the portal is expanded. */
		const PANEL_OPEN_ATTRIBUTE = "data-agent-teams-panel-open";
		/** Badge text follows the raw task status (finer than the 4 visual states):
		* claimed/pending/failed/cancelled keep their own labels and colors. */
		const TASK_STATUS_LABEL = {
			pending: "待领取",
			claimed: "已认领",
			in_progress: "进行中",
			completed: "已完成",
			failed: "失败",
			cancelled: "已取消"
		};
		function taskStatusLabel(status) {
			return TASK_STATUS_LABEL[status] ?? status;
		}
		/** Badge/bar coloring key: visual state, widened for terminal statuses. */
		function taskTone(state, status) {
			if (status === "failed") return "failed";
			if (status === "cancelled") return "cancelled";
			return state;
		}
		/** Collapsed badge: an always-visible corner pill while any team exists. */
		function CollapsedBadge({ count, busy, onClick }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ActivityPanel_module_css_default.badge,
				"data-busy": busy,
				onClick,
				"aria-label": `AgentTeams 活动，${count} 个团队`,
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeDot,
					"data-busy": busy,
					"aria-hidden": true
				}), (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeCount,
					children: count
				})]
			});
		}
		function memberDotState(member, tasks) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			if (member.activity === "working") return "ongoing";
			if (owned.some((task) => task.status === "failed")) return "error";
			if (owned.length > 0 && owned.every((task) => task.status === "completed")) return "done";
			return "warning";
		}
		function memberStateLabel(member, tasks) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			if (member.activity === "working") return "工作中";
			if (owned.some((task) => task.status === "failed")) return "有失败";
			if (owned.some((task) => task.state === "blocked")) return "等待";
			if (owned.length > 0 && owned.every((task) => task.status === "completed")) return "已交付";
			if (owned.length > 0) return "待执行";
			return "待派工";
		}
		function memberStatusText(member, tasks) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			const current = owned.find((task) => task.id === member.currentTask);
			const blocked = owned.find((task) => task.state === "blocked");
			if (member.activity === "working" && current !== void 0) return `正在执行 ${current.id}`;
			if (member.activity === "working") return "正在处理已派任务";
			if (blocked !== void 0) {
				const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== "completed");
				if (dependency !== void 0) return `等待 ${dependency.id} · ${dependency.assignee || "待认领"}`;
				return "等待前置任务";
			}
			if (member.total === 0) return "等待队长派工";
			if (member.done === member.total) return "任务已交付";
			return member.activity === "idle" ? "待继续执行" : "状态未知";
		}
		function dependencyLabel(task, tasks) {
			return task.dependencies.map((id) => {
				const dependency = tasks.find((candidate) => candidate.id === id);
				return dependency?.assignee ? `${id}·${dependency.assignee}` : id;
			}).join("、");
		}
		function TaskNode({ task, tasks, focused, dimmed, pinned, onPin, onPreview }) {
			const tone = taskTone(task.state, task.status);
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ActivityPanel_module_css_default.taskNode,
				"data-task-id": task.id,
				"data-state": tone,
				"data-focused": focused,
				"data-dimmed": dimmed,
				"aria-pressed": pinned,
				title: `${task.id} · ${task.subject}（点击固定依赖链）`,
				onClick: () => {
					onPin(task.id);
				},
				onMouseEnter: () => {
					onPreview(task.id);
				},
				onMouseLeave: () => {
					onPreview(null);
				},
				onFocus: () => {
					onPreview(task.id);
				},
				onBlur: () => {
					onPreview(null);
				},
				children: [
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.taskNodeHead,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskId,
							children: task.id
						}), (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskBadge,
							"data-state": tone,
							children: taskStatusLabel(task.status)
						})]
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.taskSubject,
						children: task.subject
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.taskRoute,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskOwner,
							children: task.assignee || "待认领"
						}), task.dependencies.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskStart,
							children: "起点"
						}) : (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskDeps,
							children: ["依赖 ", dependencyLabel(task, tasks)]
						})]
					})
				]
			});
		}
		function DependencyMap({ tasks }) {
			const [previewTaskId, setPreviewTaskId] = (0, react.useState)(null);
			const [pinnedTaskId, setPinnedTaskId] = (0, react.useState)(null);
			const focusedTaskId = pinnedTaskId ?? previewTaskId;
			const stages = (0, react.useMemo)(() => taskStages(tasks), [tasks]);
			const related = (0, react.useMemo)(() => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks), [focusedTaskId, tasks]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") setPinnedTaskId(null);
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, []);
			if (tasks.length === 0) return null;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.dependencySection,
				"aria-label": "任务依赖链",
				"data-dependency-map": true,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ActivityPanel_module_css_default.sectionHead,
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.sectionTitle,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {}), " 任务依赖"]
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.sectionHint,
						children: pinnedTaskId === null ? "悬停预览 · 点击固定" : `${pinnedTaskId} 已固定 · Esc 取消`
					})]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: ActivityPanel_module_css_default.stageFlow,
					children: stages.map((stage, index) => (0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.stageGroup,
						"data-depth": stage.depth,
						children: [index > 0 && (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.stageConnector,
							"aria-hidden": true,
							children: [(0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.stageLine }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {})]
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.stageColumn,
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.stageLabel,
								children: [stage.depth === 0 ? "起点" : `依赖层 ${stage.depth}`, (0, react_jsx_runtime.jsx)("span", { children: stage.tasks.length })]
							}), (0, react_jsx_runtime.jsx)("div", {
								className: ActivityPanel_module_css_default.stageTasks,
								children: stage.tasks.map((task) => (0, react_jsx_runtime.jsx)(TaskNode, {
									task,
									tasks,
									focused: related?.has(task.id) ?? false,
									dimmed: related !== null && !related.has(task.id),
									pinned: pinnedTaskId === task.id,
									onPin: (id) => {
										setPinnedTaskId((current) => current === id ? null : id);
									},
									onPreview: setPreviewTaskId
								}, task.id))
							})]
						})]
					}, stage.depth))
				})]
			});
		}
		function TeamSection({ team, onNavigate, historic = false }) {
			const busyCount = team.members.filter((member) => member.activity === "working").length;
			const assignedCount = team.tasks.filter((task) => task.assignee !== "").length;
			const completedCount = team.tasks.filter((task) => task.status === "completed").length;
			const allCompleted = team.tasks.length > 0 && completedCount === team.tasks.length;
			const unclaimed = team.tasks.filter((task) => {
				if (task.status === "completed" || task.status === "failed" || task.status === "cancelled") return false;
				if (task.assignee === "") return true;
				return !team.members.some((member) => member.name === task.assignee);
			});
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.team,
				"data-team-id": team.teamId,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.teamHead,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.teamName,
								title: team.name,
								children: team.name
							}),
							historic && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.historicPill,
								children: "已结束"
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.teamStats,
								children: [
									(0, react_jsx_runtime.jsxs)("span", {
										"data-stat": "members",
										children: [team.members.length, " 成员"]
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										"data-stat": "tasks",
										children: [
											completedCount,
											"/",
											team.tasks.length,
											" 完成"
										]
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										"data-stat": "messages",
										children: [team.messageCount, " 消息"]
									})
								]
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.delegationSection,
						"aria-label": "队长派工关系",
						"data-delegation-map": true,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.captainNode,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.captainAvatar,
									children: (0, react_jsx_runtime.jsx)("img", {
										className: ActivityPanel_module_css_default.leadAvatar,
										src: LEAD_ART,
										alt: "",
										"aria-hidden": true
									})
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.captainInfo,
									children: [(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.captainLine,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.captainName,
											children: "队长"
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.captainRole,
											children: "拆解 · 派发 · 汇总"
										})]
									}), (0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.captainSummary,
										children: [
											"已派发 ",
											assignedCount,
											" 项任务给 ",
											team.members.length,
											" 名成员"
										]
									})]
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.captainState,
									"data-busy": busyCount > 0,
									children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: busyCount > 0 ? "ongoing" : allCompleted ? "done" : "warning" }), busyCount > 0 ? `${busyCount} 人执行中` : allCompleted ? "已收齐" : "等待回报"]
								})
							]
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.delegationTree,
							children: [team.members.length === 0 && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.emptyHint,
								children: "暂无成员，等待队长组建团队"
							}), team.members.map((member) => {
								const owned = team.tasks.filter((task) => task.assignee === member.name);
								return (0, react_jsx_runtime.jsxs)("div", {
									className: ActivityPanel_module_css_default.memberBlock,
									"data-activity": member.activity,
									children: [
										(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.memberBranch,
											"aria-hidden": true,
											children: (0, react_jsx_runtime.jsx)("span", {})
										}),
										(0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: ActivityPanel_module_css_default.memberRow,
											"data-activity": member.activity,
											onClick: () => {
												if (member.id !== "") onNavigate(member.id);
											},
											children: [
												(0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.memberAvatar,
													"data-unread": member.unread > 0,
													children: [(0, react_jsx_runtime.jsx)("img", {
														className: ActivityPanel_module_css_default.memberArt,
														src: memberArtUrl(member.name, member.role),
														alt: "",
														"aria-hidden": true
													}), (0, react_jsx_runtime.jsx)("img", {
														className: ActivityPanel_module_css_default.stateArt,
														"data-activity": member.activity,
														src: ACTION_ART[member.activity],
														alt: "",
														"aria-hidden": true
													})]
												}),
												(0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.memberInfo,
													children: [(0, react_jsx_runtime.jsxs)("span", {
														className: ActivityPanel_module_css_default.memberLine,
														children: [
															(0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.memberName,
																children: member.name
															}),
															member.role !== "" && (0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.memberRole,
																children: member.role
															}),
															(0, react_jsx_runtime.jsxs)("span", {
																className: ActivityPanel_module_css_default.memberState,
																"data-activity": member.activity,
																children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: memberDotState(member, team.tasks) }), memberStateLabel(member, team.tasks)]
															})
														]
													}), (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.memberStatusLine,
														children: memberStatusText(member, team.tasks)
													})]
												}),
												(0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.memberCount,
													children: [
														member.done,
														"/",
														member.total
													]
												})
											]
										}),
										(0, react_jsx_runtime.jsxs)("div", {
											className: ActivityPanel_module_css_default.assignmentLine,
											children: [
												(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.assignmentLabel,
													children: "队长派发"
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.assignmentTasks,
													children: owned.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.taskEmpty,
														children: "暂无任务"
													}) : owned.map((task) => (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.assignmentChip,
														"data-state": taskTone(task.state, task.status),
														title: task.subject,
														children: task.id
													}, task.id))
												}),
												member.unread > 0 && (0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.unreadPill,
													children: [member.unread, " 条消息"]
												})
											]
										})
									]
								}, member.id);
							})]
						})]
					}),
					(0, react_jsx_runtime.jsx)(DependencyMap, { tasks: team.tasks }),
					unclaimed.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.unclaimed,
						"aria-label": "待认领任务",
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.unclaimedTitle,
							children: "待队长认领或改派"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.assignmentTasks,
							children: unclaimed.map((task) => (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.assignmentChip,
								"data-state": taskTone(task.state, task.status),
								title: task.subject,
								children: [
									task.id,
									" · ",
									task.assignee || "未分配"
								]
							}, task.id))
						})]
					}),
					team.captainInbox.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.inbox,
						"aria-label": "成员回报队长",
						children: [(0, react_jsx_runtime.jsxs)("header", {
							className: ActivityPanel_module_css_default.sectionHead,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.sectionTitle,
								children: "成员回报"
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.sectionHint,
								children: "流向队长"
							})]
						}), team.captainInbox.slice(-2).map((message, index) => (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.inboxRow,
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.inboxRoute,
								children: [
									message.from,
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {}),
									"队长"
								]
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.inboxContent,
								title: message.content,
								children: message.content
							})]
						}, index))]
					})
				]
			});
		}
		/** The top-right activity floater. Teams follow the current session: live
		* snapshots and historic card summaries are only shown while their captain
		* session is the one currently open. */
		function ActivityPanel({ sessionsList, openSession }) {
			const navigateToSession = (id) => {
				setOpen(false);
				setWasActive(false);
				openSession(id);
			};
			const [teams, setTeams] = (0, react.useState)([]);
			const [archivedTeams, setArchivedTeams] = (0, react.useState)([]);
			const [open, setOpen] = (0, react.useState)(false);
			const [openOwner, setOpenOwner] = (0, react.useState)();
			const [autoOpened, setAutoOpened] = (0, react.useState)(false);
			const [wasActive, setWasActive] = (0, react.useState)(false);
			const [historic, setHistoric] = (0, react.useState)(/* @__PURE__ */ new Map());
			const current = (0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot).current;
			const currentRef = (0, react.useRef)(current);
			(0, react.useEffect)(() => {
				currentRef.current = current;
			}, [current]);
			const mountedAtRef = (0, react.useRef)(performance.now());
			const expanded = activityPanelExpandedForSession(open, openOwner, current);
			(0, react.useLayoutEffect)(() => {
				if (openOwner === void 0 || openOwner === current) return;
				setOpen(false);
				setOpenOwner(void 0);
				setWasActive(false);
				setAutoOpened(false);
			}, [current, openOwner]);
			(0, react.useLayoutEffect)(() => {
				const root = document.documentElement;
				if (expanded) root.setAttribute(PANEL_OPEN_ATTRIBUTE, "");
				else root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
				return () => {
					root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
				};
			}, [expanded]);
			(0, react.useEffect)(() => {
				let cancelled = false;
				let inFlight = false;
				const tick = async () => {
					if (inFlight || cancelled) return;
					inFlight = true;
					try {
						const [liveResponse, archivedResponse] = await Promise.all([fetch(STATE_URL, { cache: "no-store" }), fetch(`${STATE_URL}?archived=1`, { cache: "no-store" })]);
						if (liveResponse.ok) {
							const body = await liveResponse.json();
							if (!cancelled && Array.isArray(body.teams)) setTeams(body.teams);
						}
						if (archivedResponse.ok) {
							const body = await archivedResponse.json();
							if (!cancelled && Array.isArray(body.teams)) setArchivedTeams(body.teams);
						}
					} catch {} finally {
						inFlight = false;
					}
				};
				tick();
				const timer = setInterval(() => {
					tick();
				}, POLL_MS);
				return () => {
					cancelled = true;
					clearInterval(timer);
				};
			}, []);
			(0, react.useEffect)(() => {
				const onOpenPanel = (event) => {
					const activeSession = currentRef.current;
					if (activeSession === void 0) return;
					setOpenOwner(activeSession);
					setOpen(true);
					const detail = event.detail;
					if (detail?.teamId !== void 0) {
						const owner = detail.captainSessionId !== "" ? detail.captainSessionId : currentRef.current ?? "";
						const teamKey = `${owner}:${detail.teamId}`;
						setHistoric((previous) => {
							const next = new Map(previous);
							next.set(teamKey, {
								data: detail,
								owner
							});
							return next;
						});
					}
				};
				window.addEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				return () => {
					window.removeEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				};
			}, []);
			const visibleTeams = (0, react.useMemo)(() => current === void 0 ? [] : teams.filter((team) => team.captainSessionId === current), [teams, current]);
			const visibleHistoric = (0, react.useMemo)(() => current === void 0 ? [] : [...historic.values()].filter(({ data, owner }) => owner === current && !teams.some((live) => live.captainSessionId === current && live.teamId === data.teamId) && !archivedTeams.some((archived) => archived.captainSessionId === current && archived.teamId === data.teamId)), [
				historic,
				current,
				teams,
				archivedTeams
			]);
			const visibleArchived = (0, react.useMemo)(() => current === void 0 ? [] : archivedTeams.filter((team) => team.captainSessionId === current && !teams.some((live) => live.captainSessionId === current && live.teamId === team.teamId)), [
				archivedTeams,
				current,
				teams
			]);
			const visibleCount = visibleTeams.length + visibleArchived.length + visibleHistoric.length;
			(0, react.useEffect)(() => {
				if (visibleCount > 0) {
					setWasActive(true);
					const settled = performance.now() - mountedAtRef.current >= AUTO_OPEN_SETTLE_MS;
					if (!autoOpened && settled) {
						setOpenOwner(current);
						setOpen(true);
						setAutoOpened(true);
					}
					return;
				}
				if (!wasActive) return;
				const timer = setTimeout(() => {
					setOpen(false);
					setOpenOwner(void 0);
					setWasActive(false);
					setAutoOpened(false);
				}, AUTOCLOSE_GRACE_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [
				visibleCount,
				autoOpened,
				wasActive
			]);
			const busy = (0, react.useMemo)(() => visibleTeams.some((team) => team.members.some((member) => member.activity === "working")), [visibleTeams]);
			if (!(visibleCount > 0) && !expanded) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [!expanded && (0, react_jsx_runtime.jsx)(CollapsedBadge, {
				count: visibleCount,
				busy,
				onClick: () => {
					if (current === void 0) return;
					setOpenOwner(current);
					setOpen(true);
				}
			}), expanded && (0, react_jsx_runtime.jsxs)("aside", {
				className: ActivityPanel_module_css_default.panel,
				"data-agent-teams-activity": true,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ActivityPanel_module_css_default.panelHead,
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.panelTitle,
						children: ["AgentTeams 活动", (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.panelDot,
							"data-busy": busy,
							"aria-hidden": true
						})]
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ActivityPanel_module_css_default.closeButton,
						onClick: () => {
							setOpen(false);
							setOpenOwner(void 0);
						},
						"aria-label": "关闭",
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
					})]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: ActivityPanel_module_css_default.teams,
					children: visibleCount === 0 ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.emptyHint,
						children: "暂无团队活动"
					}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						visibleTeams.map((team) => (0, react_jsx_runtime.jsx)(TeamSection, {
							team,
							onNavigate: navigateToSession
						}, team.teamId)),
						visibleArchived.map((team) => (0, react_jsx_runtime.jsx)("div", {
							"data-team-id": team.teamId,
							"data-historic": true,
							className: ActivityPanel_module_css_default.archivedWrap,
							children: (0, react_jsx_runtime.jsx)(TeamSection, {
								team,
								onNavigate: navigateToSession,
								historic: true
							})
						}, `${team.captainSessionId}:${team.teamId}`)),
						visibleHistoric.map(({ data: team, owner }) => {
							const teamKey = `${owner}:${team.teamId}`;
							return (0, react_jsx_runtime.jsxs)("section", {
								className: ActivityPanel_module_css_default.team,
								"data-team-id": team.teamId,
								"data-historic": true,
								children: [(0, react_jsx_runtime.jsxs)("header", {
									className: ActivityPanel_module_css_default.teamHead,
									children: [(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.teamName,
										title: team.teamName,
										children: [
											(0, react_jsx_runtime.jsx)("img", {
												className: ActivityPanel_module_css_default.leadAvatar,
												src: LEAD_ART,
												alt: "",
												"aria-hidden": true
											}),
											" ",
											team.teamName
										]
									}), (0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.historicPill,
										children: "已结束"
									})]
								}), (0, react_jsx_runtime.jsx)("div", {
									className: ActivityPanel_module_css_default.members,
									children: team.members.map((member) => (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: ActivityPanel_module_css_default.memberRow,
										"data-activity": "idle",
										onClick: () => {
											if (member.id !== "") navigateToSession(member.id);
										},
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.memberAvatar,
											children: (0, react_jsx_runtime.jsx)("img", {
												className: ActivityPanel_module_css_default.memberArt,
												src: memberArtUrl(member.name, member.role),
												alt: "",
												"aria-hidden": true
											})
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.memberInfo,
											children: (0, react_jsx_runtime.jsxs)("span", {
												className: ActivityPanel_module_css_default.memberLine,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.memberName,
													children: member.name
												}), member.role !== "" && (0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.memberRole,
													children: member.role
												})]
											})
										})]
									}, member.id))
								})]
							}, teamKey);
						})
					] })
				})]
			})] });
		}
		//#endregion
		//#region lib/client/agent-teams-card-definition.js
		/**
		* AgentTeams conversation card: a lightweight in-conversation summary shown
		* when a team is created — the captain's name, the member roster with whale
		* avatars, and an entry point that re-activates the top-right activity
		* panel (useful after the floater was closed, or when re-opening an old
		* session for review).
		*
		* The fold anchors to the Harness's durable `tool/call` + `tool/result`
		* records for `agent_teams_create`. Those are first-party session events, so
		* the card survives restarts without writing an out-of-repo event type.
		* @module dsh-agent-teams/client/card
		*/
		/** Parse the only create-call fields the historic card owns. */
		function parseAgentTeamsCreateArgs(value) {
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || parsed === null || !("name" in parsed) || typeof parsed.name !== "string") return;
				const name = parsed.name.trim();
				if (name === "") return void 0;
				const cleaned = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
				return {
					teamId: cleaned === "" ? "team" : cleaned,
					name
				};
			} catch {
				return;
			}
		}
		/** Durable first-party tool events folded into one keyed Chat node. */
		const agentTeamsCardDefinition = {
			kind: "agent-teams",
			target: "chat",
			match: (event) => {
				if (event.type === "tool/call" && event.data.name === "agent_teams_create") return parseAgentTeamsCreateArgs(event.data.arguments) === void 0 ? null : {
					id: String(event.data.callId),
					role: "start"
				};
				if (event.type === "tool/result" && event.data.message.source.kind === "tool") return {
					id: String(event.data.message.source.callId),
					role: "update"
				};
				return null;
			},
			start: (_context, match) => {
				if (match.event.type !== "tool/call") throw new Error("agent-teams card start requires agent_teams_create tool/call");
				const parsed = parseAgentTeamsCreateArgs(match.event.data.arguments);
				if (parsed === void 0) throw new Error("agent-teams card start requires valid create arguments");
				return {
					...parsed,
					accepted: false
				};
			},
			update: (context, match) => {
				if (match.event.type !== "tool/result") return context.state;
				if (match.event.data.error !== void 0 || match.event.data.message.content.some((block) => block.type === "tool-result" && block.isError === true)) return context.state;
				return {
					...context.state,
					accepted: true
				};
			},
			buildViewNode: (context) => {
				if (context.start === void 0) return null;
				const state = context.state;
				if (!state.accepted) return null;
				return {
					key: context.key,
					kind: "agent-teams",
					id: context.id,
					target: "chat",
					anchorSeq: context.start.event.seq,
					location: context.start.location,
					visibility: "visible",
					data: {
						teamId: state.teamId,
						captainSessionId: "",
						teamName: state.name,
						members: []
					}
				};
			}
		};
		//#endregion
		//#region \0dsh-css:D:\github\dsh-agent-teams\src\client\TeamSettingsPage.module.css.mjs
		const css = ".Nc72OW_wrap{flex-direction:column;max-width:680px;padding:0 16px 16px;display:flex}.Nc72OW_pickerRow{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.Nc72OW_form{flex-direction:column;display:flex}.Nc72OW_row{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.Nc72OW_row:last-child{border-bottom:none}.Nc72OW_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.Nc72OW_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.Nc72OW_desc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.Nc72OW_selectorWrap{flex:1;min-width:0;display:flex}.Nc72OW_selectorWrap [role=menu]{width:100%;min-width:0;max-width:none}.Nc72OW_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;flex:1;justify-content:flex-start;align-items:center;gap:12px;min-width:0;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.Nc72OW_selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.Nc72OW_selector:disabled{opacity:.5;cursor:default}.Nc72OW_selectorText{text-overflow:ellipsis;white-space:nowrap;text-align:left;flex:1;min-width:0;overflow:hidden}.Nc72OW_chevron{flex:none}.Nc72OW_nameInput{width:240px}.Nc72OW_textarea{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-height:64px;font:inherit;color:var(--dsw-alias-label-primary);resize:vertical;box-sizing:border-box;border-radius:8px;flex:0 280px;padding:6px 8px;font-size:14px;line-height:22px}.Nc72OW_textarea:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.Nc72OW_textarea::placeholder{color:var(--dsw-alias-label-dimmed)}.Nc72OW_empty{color:var(--dsw-alias-label-secondary);padding:16px 0;font-size:13px;line-height:20px}.Nc72OW_error{color:var(--dsw-alias-state-error-primary);padding:16px 0;font-size:13px;line-height:20px}.Nc72OW_hint{color:var(--dsw-alias-label-secondary);padding-top:12px;font-size:12px;line-height:18px}.Nc72OW_danger{color:var(--dsw-alias-state-error-primary)}";
		const tagId = "@nanmicoder/dsh-agent-teams/TeamSettingsPage.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-agent-teams";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TeamSettingsPage_module_css_default = {
			"chevron": "Nc72OW_chevron",
			"danger": "Nc72OW_danger",
			"desc": "Nc72OW_desc",
			"empty": "Nc72OW_empty",
			"error": "Nc72OW_error",
			"form": "Nc72OW_form",
			"hint": "Nc72OW_hint",
			"nameInput": "Nc72OW_nameInput",
			"pickerRow": "Nc72OW_pickerRow",
			"row": "Nc72OW_row",
			"rowText": "Nc72OW_rowText",
			"selector": "Nc72OW_selector",
			"selectorText": "Nc72OW_selectorText",
			"selectorWrap": "Nc72OW_selectorWrap",
			"textarea": "Nc72OW_textarea",
			"title": "Nc72OW_title",
			"wrap": "Nc72OW_wrap"
		};
		//#endregion
		//#region lib/client/TeamSettingsPage.js
		/**
		* 「团队」settings page: manage the member-profile library (named member
		* templates with a description, model, reasoning effort, and agent preset).
		* The library lives in the host `settings` service; this page talks to it
		* through the package-private RPC methods registered by the host half.
		*
		* Layout follows the official Setting-Cell convention (figma 'Setting-Cell'):
		* 16/0 rows separated by `--dsw-alias-border-l2` hairlines, 14px titles,
		* 36px selector pills (`--dsw-alias-bg-module-platform`) backed by the
		* primitives `Menu`, and official `Icon*Outline*` glyphs — no custom icons.
		* @module dsh-agent-teams/client/TeamSettingsPage
		*/
		/**
		* Same-origin settings-page endpoint served by the host half. The
		* package-private `harness.handle()` bridge exists only in the dynamic-code
		* VM, not in an ordinary installed Cordis package, so the page talks to the
		* host through this regular HTTP route instead.
		*/
		const PROFILES_ROUTE = "/plugins/dsh-agent-teams/profiles";
		async function apiGet() {
			const res = await fetch(PROFILES_ROUTE, { cache: "no-store" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		}
		async function apiSave(profiles) {
			const res = await fetch(PROFILES_ROUTE, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ profiles })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			await res.json();
		}
		const EMPTY_DRAFT = {
			name: "",
			description: "",
			model: "",
			reasoningEffort: "",
			preset: ""
		};
		/** One pill selector: Menu + official chevron, in the Setting-Cell style. */
		function Selector({ value, options, display, emptyLabel, onSelect, disabled }) {
			const [open, setOpen] = (0, react.useState)(false);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: () => {
					setOpen(false);
				},
				items: ["", ...options.filter((o) => o !== "")].map((id) => ({
					id,
					label: id === "" ? emptyLabel : display(id)
				})),
				selectedId: value,
				onSelect: (id) => {
					onSelect(id);
					setOpen(false);
				},
				align: "end",
				className: TeamSettingsPage_module_css_default.selectorWrap,
				anchor: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: TeamSettingsPage_module_css_default.selector,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					disabled,
					onClick: () => {
						setOpen((v) => !v);
					},
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: TeamSettingsPage_module_css_default.selectorText,
						children: value === "" ? emptyLabel : display(value)
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: TeamSettingsPage_module_css_default.chevron })]
				})
			});
		}
		function TeamSettingsPage() {
			const [snap, setSnap] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [selected, setSelected] = (0, react.useState)("");
			const [draft, setDraft] = (0, react.useState)(null);
			const [confirmDelete, setConfirmDelete] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const load = async () => {
				try {
					setSnap(await apiGet());
					setError(null);
				} catch (err) {
					setSnap(null);
					setError(`无法加载成员模板：${err instanceof Error ? err.message : String(err)}（插件 host 可能未更新，请重启 dsh 后重试）`);
				}
			};
			(0, react.useEffect)(() => {
				load();
			}, []);
			const save = async (profiles) => {
				setBusy(true);
				try {
					await apiSave(profiles);
					await load();
				} finally {
					setBusy(false);
				}
			};
			const onSelect = (name) => {
				if (snap === null) return;
				setSelected(name);
				const found = snap.profiles.find((p) => p.name === name);
				setDraft(found !== void 0 ? { ...found } : null);
				setConfirmDelete(false);
			};
			const onAdd = () => {
				setSelected("");
				setDraft({ ...EMPTY_DRAFT });
				setConfirmDelete(false);
			};
			const onSave = async () => {
				if (draft === null || snap === null) return;
				const name = draft.name.trim();
				if (name === "") return;
				await save(snap.profiles.some((p) => p.name === name) ? snap.profiles.map((p) => p.name === name ? draft : p) : [...snap.profiles, draft]);
				setSelected(name);
				setConfirmDelete(false);
			};
			const onDelete = async () => {
				if (draft === null || snap === null) return;
				if (!confirmDelete) {
					setConfirmDelete(true);
					return;
				}
				setConfirmDelete(false);
				await save(snap.profiles.filter((p) => p.name !== draft.name));
				setDraft(null);
				setSelected("");
			};
			const patch = (field, value) => {
				if (draft === null) return;
				setDraft({
					...draft,
					[field]: value
				});
			};
			if (snap === null) return (0, react_jsx_runtime.jsx)("div", {
				className: TeamSettingsPage_module_css_default.wrap,
				children: error !== null ? (0, react_jsx_runtime.jsx)("div", {
					className: TeamSettingsPage_module_css_default.error,
					children: error
				}) : (0, react_jsx_runtime.jsx)("div", {
					className: TeamSettingsPage_module_css_default.empty,
					children: "加载成员模板…"
				})
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TeamSettingsPage_module_css_default.wrap,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: TeamSettingsPage_module_css_default.pickerRow,
					children: [
						(0, react_jsx_runtime.jsx)(Selector, {
							value: selected,
							options: snap.profiles.map((p) => p.name),
							display: (n) => n,
							emptyLabel: "选择成员模板…",
							onSelect,
							disabled: busy
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {}),
							title: "添加成员模板",
							onClick: onAdd,
							disabled: busy,
							children: "添加"
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDownloadOutline16, {}),
							title: "保存当前模板",
							onClick: onSave,
							disabled: draft === null || busy || draft.name.trim() === "",
							children: "保存"
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
							title: confirmDelete ? "再次点击确认删除" : "删除当前模板",
							onClick: onDelete,
							disabled: draft === null || busy,
							className: confirmDelete ? TeamSettingsPage_module_css_default.danger : void 0,
							children: confirmDelete ? "确认?" : ""
						})
					]
				}), draft === null ? (0, react_jsx_runtime.jsx)("div", {
					className: TeamSettingsPage_module_css_default.empty,
					children: snap.profiles.length === 0 ? "还没有成员模板。点击「添加」创建一个：给它起名、写清何时使用、选模型/推理等级/预设，队长就能用 agent_teams_add_member(template=\"名字\") 按模板拉成员。" : "选择一个模板进行编辑，或点击「添加」创建新模板。"
				}) : (0, react_jsx_runtime.jsxs)("div", {
					className: TeamSettingsPage_module_css_default.form,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: TeamSettingsPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: TeamSettingsPage_module_css_default.rowText,
								children: (0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.title,
									children: "名称"
								})
							}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								className: TeamSettingsPage_module_css_default.nameInput,
								value: draft.name,
								placeholder: "模板名（唯一）",
								disabled: busy,
								onChange: (e) => patch("name", e.target.value)
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: TeamSettingsPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: TeamSettingsPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.title,
									children: "描述"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.desc,
									children: "发给主代理：什么时候才调用这个模板"
								})]
							}), (0, react_jsx_runtime.jsx)("textarea", {
								className: TeamSettingsPage_module_css_default.textarea,
								value: draft.description,
								placeholder: "例：扮演女主角林晚时使用；需要剧情推进方案时使用……",
								disabled: busy,
								onChange: (e) => patch("description", e.target.value)
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: TeamSettingsPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: TeamSettingsPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.title,
									children: "模型"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.desc,
									children: "成员使用的模型，默认跟随队长"
								})]
							}), (0, react_jsx_runtime.jsx)(Selector, {
								value: draft.model,
								options: snap.models,
								display: (m) => m,
								emptyLabel: "默认（队长的模型）",
								onSelect: (id) => patch("model", id),
								disabled: busy
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: TeamSettingsPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: TeamSettingsPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.title,
									children: "推理等级"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.desc,
									children: "off / high / max，默认跟随模型"
								})]
							}), (0, react_jsx_runtime.jsx)(Selector, {
								value: draft.reasoningEffort,
								options: snap.efforts.filter((e) => e !== ""),
								display: (e) => e,
								emptyLabel: "默认",
								onSelect: (id) => patch("reasoningEffort", id),
								disabled: busy
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: TeamSettingsPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: TeamSettingsPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.title,
									children: "预设"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: TeamSettingsPage_module_css_default.desc,
									children: "成员挂载的 agent 预设，默认继承队长"
								})]
							}), (0, react_jsx_runtime.jsx)(Selector, {
								value: draft.preset,
								options: snap.presets,
								display: (p) => p,
								emptyLabel: "继承（队长的预设）",
								onSelect: (id) => patch("preset", id),
								disabled: busy
							})]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: TeamSettingsPage_module_css_default.hint,
							children: "保存后，主代理的系统提示里会出现这份模板目录；调用 agent_teams_add_member(template=\"名字\") 即可按模板拉成员（显式传入的 model / preset / persona 优先）。"
						})
					]
				})]
			});
		}
		//#endregion
		//#region lib/client/index.js
		/** Required services: conversation nodes, slots, and sessions navigation. */
		const inject = [
			"conversationEvents",
			"slots",
			"sessions"
		];
		/**
		* Mount the floater through a body portal (the web shell has no top-right
		* slot) and register the in-conversation team card, whose "activity panel"
		* button re-activates the floater via a window event — the recovery path
		* for a closed floater or a re-opened session.
		*/
		function apply(ctx) {
			const host = document.createElement("div");
			host.dataset.agentTeamsHost = "";
			document.body.appendChild(host);
			const root = (0, react_dom_client.createRoot)(host);
			root.render((0, react_jsx_runtime.jsx)(ActivityPanel, {
				sessionsList: ctx.sessions.list,
				openSession: (id) => {
					ctx.sessions.open(id);
				}
			}));
			ctx.effect(() => () => {
				root.unmount();
				host.remove();
			}, "agent-teams: activity panel");
			ctx.conversationEvents.register(agentTeamsCardDefinition);
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: "agent-teams",
				inject: () => ({
					openSession: (id) => {
						ctx.sessions.open(id);
					},
					currentSessionId: () => ctx.sessions.list.getSnapshot().current
				})
			}, AgentTeamsCard));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "agent-teams",
				order: 50,
				label: () => "团队"
			}, TeamSettingsPage));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map