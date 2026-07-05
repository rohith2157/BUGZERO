export function generateGitHubTag(profile, repos) {
    if (!profile) return null;

    // Default tag if no data
    if (!repos || repos.length === 0) return { tag: 'Newbie Coder', score: 40, tier: 'bronze' };

    // 1. Calculate Metrics
    const followers = profile.followers || 0;
    const following = profile.following || 0;
    const publicRepos = profile.publicRepos || 0;
    
    const accountAgeYears = profile.createdAt 
        ? (new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24 * 365.25)
        : 1;

    let totalStars = 0;
    let totalForks = 0;
    let totalSize = 0;
    const languageCounts = {};
    let isPrivateHeavy = false;
    let privateCount = 0;

    repos.forEach(repo => {
        totalStars += (repo.stargazers_count || 0);
        totalForks += (repo.forks_count || 0);
        totalSize += (repo.size || 0);
        if (repo.private) privateCount++;
        
        if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        }
    });

    isPrivateHeavy = privateCount > (repos.length / 2);

    // 2. Determine Primary Language / Specialty
    let specialty = 'Full-Stack';
    const langs = Object.keys(languageCounts);
    if (langs.length > 5) {
        specialty = 'Polyglot';
    } else if (langs.length > 0) {
        // Sort by frequency
        const topLang = langs.sort((a, b) => languageCounts[b] - languageCounts[a])[0];
        specialty = topLang;
    } else if (publicRepos === 0 && privateCount > 0) {
        specialty = 'Enterprise';
    }

    // 3. Determine Adjective (Based on Age, Followers, Privacy)
    let adjective = 'Dedicated';
    const score = totalStars * 5 + followers * 3 + publicRepos;
    
    if (accountAgeYears > 7 && score > 100) {
        adjective = 'Legendary';
    } else if (accountAgeYears > 5) {
        adjective = 'Veteran';
    } else if (accountAgeYears < 2 && score > 50) {
        adjective = 'Rising';
    } else if (isPrivateHeavy) {
        adjective = 'Stealth';
    } else if (score > 500) {
        adjective = 'Elite';
    } else if (publicRepos > 30) {
        adjective = 'Open-Source';
    } else if (followers > following * 2 && followers > 10) {
        adjective = 'Influential';
    } else if (accountAgeYears < 1) {
        adjective = 'Novice';
    } else if (totalForks > 20) {
        adjective = 'Collaborative';
    } else if (totalSize > 100000) {
        adjective = 'Heavyweight';
    } else {
        const randomAdjectives = ['Relentless', 'Hidden', 'Passionate', 'Tenacious'];
        adjective = randomAdjectives[publicRepos % randomAdjectives.length];
    }

    // 4. Determine Noun (Based on Stars, Repos, Forks)
    let noun = 'Hacker';
    if (totalStars > 100) {
        noun = 'Maestro';
    } else if (publicRepos > 50 && totalStars < 10) {
        noun = 'Hoarder';
    } else if (totalForks > 50) {
        noun = 'Pioneer';
    } else if (publicRepos > 40) {
        noun = 'Architect';
    } else if (followers > 50) {
        noun = 'Icon';
    } else if (totalSize < 5000 && publicRepos > 10) {
        noun = 'Minimalist';
    } else {
        const randomNouns = ['Ninja', 'Contributor', 'Engineer', 'Developer', 'Enthusiast'];
        noun = randomNouns[totalStars % randomNouns.length];
    }

    // 5. Compute Dev Score (FIFA 1-99 style)
    let devScore = 40;
    devScore += Math.min(15, accountAgeYears * 1.5);
    devScore += Math.min(20, (publicRepos + privateCount) * 0.4);
    devScore += Math.min(15, totalStars * 0.5);
    devScore += Math.min(9, followers * 1);
    
    // Cap at 99
    devScore = Math.floor(Math.min(99, devScore));

    return {
        tag: `${adjective} ${specialty} ${noun}`,
        score: devScore,
        tier: devScore >= 85 ? 'gold' : devScore >= 65 ? 'silver' : 'bronze'
    };
}
