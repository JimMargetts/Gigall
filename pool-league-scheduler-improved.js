/**
 * Improved Pool League Fixture Scheduler
 * Creates a more balanced schedule with better match distribution across weeks
 */

/**
 * Generate all possible matches for the season
 * Each team plays every other team twice (home and away)
 */
function generateAllMatches(teams) {
    const matches = [];
    
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams.length; j++) {
            if (i !== j) {
                matches.push({
                    homeTeam: teams[i],
                    awayTeam: teams[j],
                    played: false,
                    id: `${teams[i].teamID}-${teams[j].teamID}`
                });
            }
        }
    }
    
    return matches;
}

/**
 * Group teams by their table ID
 */
function groupTeamsByTable(teams) {
    const tableGroups = {};
    
    teams.forEach(team => {
        if (!tableGroups[team.tableID]) {
            tableGroups[team.tableID] = [];
        }
        tableGroups[team.tableID].push(team);
    });
    
    return tableGroups;
}

/**
 * Check if a set of matches can be played in the same week
 * Teams sharing a table cannot both be at home
 */
function canPlayInSameWeek(matches, tableGroups) {
    const homeTeamsPerTable = {};
    const usedTeams = new Set();
    
    // Check for duplicate teams first
    for (const match of matches) {
        if (usedTeams.has(match.homeTeam.teamID) || usedTeams.has(match.awayTeam.teamID)) {
            return false;
        }
        usedTeams.add(match.homeTeam.teamID);
        usedTeams.add(match.awayTeam.teamID);
    }
    
    // Count home teams per table
    matches.forEach(match => {
        const tableID = match.homeTeam.tableID;
        if (!homeTeamsPerTable[tableID]) {
            homeTeamsPerTable[tableID] = 0;
        }
        homeTeamsPerTable[tableID]++;
    });
    
    // Check constraint: max 1 home team per table
    for (const tableID in homeTeamsPerTable) {
        if (homeTeamsPerTable[tableID] > 1) {
            return false;
        }
    }
    
    return true;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Find the best combination of matches for a week using backtracking
 */
function findBestWeekMatches(availableMatches, targetMatchCount, tableGroups) {
    const bestCombination = [];
    
    function backtrack(currentMatches, startIndex, usedTeams) {
        // If we've found enough matches or checked all possibilities
        if (currentMatches.length === targetMatchCount || startIndex >= availableMatches.length) {
            if (currentMatches.length > bestCombination.length && 
                canPlayInSameWeek(currentMatches, tableGroups)) {
                bestCombination.length = 0;
                bestCombination.push(...currentMatches);
            }
            return;
        }
        
        // Early termination if we can't possibly beat the current best
        const remaining = availableMatches.length - startIndex;
        if (currentMatches.length + remaining <= bestCombination.length) {
            return;
        }
        
        for (let i = startIndex; i < availableMatches.length; i++) {
            const match = availableMatches[i];
            
            // Check if both teams are available
            if (!usedTeams.has(match.homeTeam.teamID) && !usedTeams.has(match.awayTeam.teamID)) {
                // Try adding this match
                const newMatches = [...currentMatches, match];
                if (canPlayInSameWeek(newMatches, tableGroups)) {
                    const newUsedTeams = new Set(usedTeams);
                    newUsedTeams.add(match.homeTeam.teamID);
                    newUsedTeams.add(match.awayTeam.teamID);
                    
                    backtrack(newMatches, i + 1, newUsedTeams);
                }
            }
        }
    }
    
    backtrack([], 0, new Set());
    return bestCombination;
}

/**
 * Improved fixture generation with better distribution
 */
function generateFixtureSchedule(teams) {
    const allMatches = generateAllMatches(teams);
    const tableGroups = groupTeamsByTable(teams);
    const schedule = [];
    const targetMatchesPerWeek = Math.floor(teams.length / 2);
    
    // Shuffle matches to avoid patterns
    let remainingMatches = shuffleArray(allMatches);
    
    // Continue until all matches are scheduled
    while (remainingMatches.length > 0) {
        // Calculate dynamic target based on remaining matches and desired completion time
        const remainingWeeks = Math.max(1, Math.ceil(remainingMatches.length / targetMatchesPerWeek));
        const adjustedTarget = Math.min(targetMatchesPerWeek, 
            Math.ceil(remainingMatches.length / remainingWeeks));
        
        // Find best combination for this week
        const weekMatches = findBestWeekMatches(remainingMatches, adjustedTarget, tableGroups);
        
        if (weekMatches.length === 0) {
            // If no matches found, try with a smaller target or force at least one match
            console.warn(`Week ${schedule.length + 1}: Could only find ${weekMatches.length} matches`);
            
            // Find at least one valid match
            for (let i = 0; i < remainingMatches.length; i++) {
                if (canPlayInSameWeek([remainingMatches[i]], tableGroups)) {
                    weekMatches.push(remainingMatches[i]);
                    break;
                }
            }
            
            if (weekMatches.length === 0) {
                console.error("Could not find any valid matches - breaking");
                break;
            }
        }
        
        // Remove scheduled matches from remaining matches
        weekMatches.forEach(scheduledMatch => {
            const index = remainingMatches.findIndex(match => match.id === scheduledMatch.id);
            if (index !== -1) {
                remainingMatches.splice(index, 1);
            }
        });
        
        // Add week to schedule
        schedule.push({
            week: schedule.length + 1,
            matches: weekMatches
        });
        
        // Re-shuffle remaining matches to avoid patterns
        if (remainingMatches.length > 0) {
            remainingMatches = shuffleArray(remainingMatches);
        }
    }
    
    return schedule;
}

/**
 * Alternative algorithm using round-robin approach
 */
function generateBalancedFixtureSchedule(teams) {
    const tableGroups = groupTeamsByTable(teams);
    const schedule = [];
    const n = teams.length;
    const matchesPerWeek = Math.floor(n / 2);
    
    // Create round-robin schedule for first half (each team plays each other once)
    const firstHalf = generateRoundRobinHalf(teams, tableGroups);
    
    // Create second half by reversing home/away for each match
    const secondHalf = firstHalf.map(week => ({
        week: week.week + firstHalf.length,
        matches: week.matches.map(match => ({
            homeTeam: match.awayTeam,
            awayTeam: match.homeTeam,
            id: `${match.awayTeam.teamID}-${match.homeTeam.teamID}`
        }))
    }));
    
    // Combine both halves
    return [...firstHalf, ...secondHalf];
}

/**
 * Generate round-robin for one half of the season
 */
function generateRoundRobinHalf(teams, tableGroups) {
    const schedule = [];
    const n = teams.length;
    const rounds = n % 2 === 0 ? n - 1 : n;
    
    // If odd number of teams, add a "bye" team
    const teamsWithBye = n % 2 === 0 ? [...teams] : [...teams, { teamID: -1, name: "BYE", tableID: -1 }];
    const totalTeams = teamsWithBye.length;
    
    for (let round = 0; round < rounds; round++) {
        const weekMatches = [];
        
        for (let i = 0; i < totalTeams / 2; i++) {
            const home = (round + i) % (totalTeams - 1);
            const away = (totalTeams - 1 - i + round) % (totalTeams - 1);
            
            // Adjust for the fixed team
            const homeTeam = home === totalTeams - 1 ? teamsWithBye[totalTeams - 1] : teamsWithBye[home];
            const awayTeam = away === totalTeams - 1 ? teamsWithBye[totalTeams - 1] : teamsWithBye[away];
            
            // Skip matches involving the bye team
            if (homeTeam.teamID !== -1 && awayTeam.teamID !== -1) {
                weekMatches.push({
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    id: `${homeTeam.teamID}-${awayTeam.teamID}`
                });
            }
        }
        
        // Validate and adjust for table constraints
        const validMatches = adjustForTableConstraints(weekMatches, tableGroups);
        
        if (validMatches.length > 0) {
            schedule.push({
                week: round + 1,
                matches: validMatches
            });
        }
    }
    
    return schedule;
}

/**
 * Adjust matches to satisfy table constraints
 */
function adjustForTableConstraints(matches, tableGroups) {
    // Check if current matches violate table constraints
    if (canPlayInSameWeek(matches, tableGroups)) {
        return matches;
    }
    
    // Try to fix by swapping home/away for conflicting matches
    const homeTeamsPerTable = {};
    matches.forEach(match => {
        const tableID = match.homeTeam.tableID;
        if (!homeTeamsPerTable[tableID]) {
            homeTeamsPerTable[tableID] = [];
        }
        homeTeamsPerTable[tableID].push(match);
    });
    
    // Find tables with conflicts and try to resolve
    const adjustedMatches = [...matches];
    
    for (const tableID in homeTeamsPerTable) {
        if (homeTeamsPerTable[tableID].length > 1) {
            // Swap home/away for all but the first match at this table
            for (let i = 1; i < homeTeamsPerTable[tableID].length; i++) {
                const matchIndex = adjustedMatches.findIndex(m => m.id === homeTeamsPerTable[tableID][i].id);
                if (matchIndex !== -1) {
                    const match = adjustedMatches[matchIndex];
                    adjustedMatches[matchIndex] = {
                        homeTeam: match.awayTeam,
                        awayTeam: match.homeTeam,
                        id: `${match.awayTeam.teamID}-${match.homeTeam.teamID}`
                    };
                }
            }
        }
    }
    
    // Return adjusted matches if they're valid, otherwise return subset that works
    if (canPlayInSameWeek(adjustedMatches, tableGroups)) {
        return adjustedMatches;
    }
    
    // If still not valid, return a valid subset
    const validMatches = [];
    const usedTeams = new Set();
    
    for (const match of adjustedMatches) {
        if (!usedTeams.has(match.homeTeam.teamID) && 
            !usedTeams.has(match.awayTeam.teamID) &&
            canPlayInSameWeek([...validMatches, match], tableGroups)) {
            validMatches.push(match);
            usedTeams.add(match.homeTeam.teamID);
            usedTeams.add(match.awayTeam.teamID);
        }
    }
    
    return validMatches;
}

/**
 * Validate the generated schedule
 */
function validateSchedule(schedule, teams) {
    const validation = {
        valid: true,
        errors: [],
        stats: {}
    };
    
    // Check total matches
    const totalMatches = schedule.reduce((sum, week) => sum + week.matches.length, 0);
    const expectedMatches = teams.length * (teams.length - 1); // n * (n-1) for double round-robin
    
    if (totalMatches !== expectedMatches) {
        validation.valid = false;
        validation.errors.push(`Total matches: ${totalMatches}, Expected: ${expectedMatches}`);
    }
    
    // Check table constraints
    schedule.forEach((week, weekIndex) => {
        const homeTeamsPerTable = {};
        week.matches.forEach(match => {
            const tableID = match.homeTeam.tableID;
            homeTeamsPerTable[tableID] = (homeTeamsPerTable[tableID] || 0) + 1;
        });
        
        for (const tableID in homeTeamsPerTable) {
            if (homeTeamsPerTable[tableID] > 1) {
                validation.valid = false;
                validation.errors.push(`Week ${week.week}: Table ${tableID} has ${homeTeamsPerTable[tableID]} home teams`);
            }
        }
    });
    
    // Count matches per team
    const teamMatchCounts = {};
    teams.forEach(team => {
        teamMatchCounts[team.teamID] = { home: 0, away: 0, total: 0 };
    });
    
    schedule.forEach(week => {
        week.matches.forEach(match => {
            teamMatchCounts[match.homeTeam.teamID].home++;
            teamMatchCounts[match.homeTeam.teamID].total++;
            teamMatchCounts[match.awayTeam.teamID].away++;
            teamMatchCounts[match.awayTeam.teamID].total++;
        });
    });
    
    validation.stats = {
        totalWeeks: schedule.length,
        totalMatches: totalMatches,
        expectedMatches: expectedMatches,
        teamMatchCounts: teamMatchCounts,
        matchesPerWeek: schedule.map(week => week.matches.length),
        avgMatchesPerWeek: totalMatches / schedule.length
    };
    
    return validation;
}

/**
 * Format schedule for display
 */
function formatScheduleForDisplay(schedule) {
    return schedule.map(week => {
        return {
            week: week.week,
            matches: week.matches.map(match => ({
                homeTeam: match.homeTeam.name,
                awayTeam: match.awayTeam.name,
                homeTableID: match.homeTeam.tableID,
                awayTableID: match.awayTeam.tableID
            }))
        };
    });
}

// Export functions for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateFixtureSchedule,
        generateBalancedFixtureSchedule,
        validateSchedule,
        formatScheduleForDisplay,
        groupTeamsByTable
    };
}