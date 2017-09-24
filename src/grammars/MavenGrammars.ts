import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { atLeastOne } from "@atomist/microgrammar/Rep";
import { VersionedArtifact } from "./VersionedArtifact";

export const ElementName = /^[a-zA-Z_.0-9\-]+/;

export const ElementContent = /^[a-zA-Z_.0-9\-]+/;

export const XmlTagWithSimpleValueGrammar = {
    _l: "<",
    name: ElementName,
    _r: ">",
    value: ElementContent,
    _l2: "</",
    _close: ElementName,
    _ok: ctx => ctx._close === ctx.name,
    _r2: ">",
};

export interface XmlTag {
    name: string;
    value: string;
}

/**
 * GAV can be in any order in Maven POMs, so this grammar is more
 * complicated than it would seem
 * @type {Microgrammar<{gav: VersionedArtifact}>}
 */
export const GavGrammar = Microgrammar.fromDefinitions<{ gav: VersionedArtifact }>({
    tags: atLeastOne(XmlTagWithSimpleValueGrammar),
    // We need both these for it to be valid. version is optional
    _valid: ctx =>
        ctx.tags.filter(t => t.name === "groupId").length > 0 &&
        ctx.tags.filter(t => t.name === "artifactId").length > 0,
    gav: ctx => {
        const group = ctx.tags.filter(tag => tag.name === "groupId")[0].value;
        const artifact = ctx.tags.filter(tag => tag.name === "artifactId")[0].value;
        const versions = ctx.tags.filter(tag => tag.name === "version");
        const version = versions.length === 1 ? versions[0].value : undefined;
        return { group, artifact, version };
    },
});

export const ParentStanzaGrammar = Microgrammar.fromDefinitions<ParentStanza>({
    _start: "<parent>",
    _gav: GavGrammar,
    gav: ctx => ctx._gav.gav,
    // Pull this up so that we can modify it directly.
    // We can't modify through gav property as it's computed by a function in GavGrammar
    version: ctx => ctx._gav.tags.find(t => t.name === "version"),
});

export interface ParentStanza {
    gav: VersionedArtifact;
    version?: XmlTag;
}
