import Exa from 'exa-js';

// PhET only offers its metadata API to paying partners, so simulations are found by searching the PhET site with Exa instead.
const exa = new Exa(import.meta.env.EXA_SEARCH_API_KEY || process.env.EXA_SEARCH_API_KEY);

const PHET_DOMAIN = 'phet.colorado.edu';
const SIMULATION_PATH = /^\/[a-z]{2}(?:_[A-Z]{2})?\/simulations\/([a-z0-9-]+)\/?$/;

interface Simulation {
    title: string;
    pageUrl: string;
    embedUrl: string;
    description: string;
}

export default async function findSimulations(topic: string): Promise<Simulation[]> {
    const searchResult = await exa.searchAndContents(
        `PhET interactive simulation: ${topic}`,
        {
            includeDomains: [PHET_DOMAIN],
            text: { maxCharacters: 500 },
            numResults: 10,
        }
    );

    const seen = new Set<string>();
    return searchResult.results.flatMap((result) => {
        let slug: string | undefined;
        try {
            const { hostname, pathname } = new URL(result.url);
            if (hostname === PHET_DOMAIN) slug = pathname.match(SIMULATION_PATH)?.[1];
        } catch {
            return [];
        }

        if (!slug || seen.has(slug)) return [];
        seen.add(slug);

        return [{
            title: result.title ?? slug,
            pageUrl: `https://${PHET_DOMAIN}/en/simulations/${slug}`,
            // Only HTML5 simulations can be embedded; older Java and Flash ones only have a page.
            embedUrl: `https://${PHET_DOMAIN}/sims/html/${slug}/latest/${slug}_all.html`,
            description: result.text,
        }];
    }).slice(0, 5);
}
