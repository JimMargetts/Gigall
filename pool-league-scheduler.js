/**
 * Pool League Fixture Scheduler
 * Creates a schedule where every team plays every other team twice (home and away)
 * with table constraints ensuring teams sharing tables don't play at home on the same night
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
                    played: false
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
 * Generate weekly fixtures using a round-robin approach with table constraints
 */
function generateFixtureSchedule(teams) {
    const allMatches = generateAllMatches(teams);
    const tableGroups = groupTeamsByTable(teams);
    const schedule = [];
    const matchesPerWeek = Math.floor(teams.length / 2);
    
    // Create a copy of matches to work with
    let remainingMatches = [...allMatches];
    
    while (remainingMatches.length > 0) {
        const weekMatches = [];
        const usedTeams = new Set();
        
        // Try to find valid matches for this week
        for (let i = 0; i < remainingMatches.length && weekMatches.length < matchesPerWeek; i++) {
            const match = remainingMatches[i];
            
            // Check if both teams are available
            if (!usedTeams.has(match.homeTeam.teamID) && !usedTeams.has(match.awayTeam.teamID)) {
                // Check if adding this match violates table constraints
                const testMatches = [...weekMatches, match];
                if (canPlayInSameWeek(testMatches, tableGroups)) {
                    weekMatches.push(match);
                    usedTeams.add(match.homeTeam.teamID);
                    usedTeams.add(match.awayTeam.teamID);
                    remainingMatches.splice(i, 1);
                    i--; // Adjust index after removal
                }
            }
        }
        
        if (weekMatches.length === 0) {
            // If no valid matches found, break to avoid infinite loop
            console.warn("Could not schedule remaining matches:", remainingMatches.length);
            break;
        }
        
        schedule.push({
            week: schedule.length + 1,
            matches: weekMatches
        });
    }
    
    return schedule;
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
        teamMatchCounts: teamMatchCounts
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
        validateSchedule,
        formatScheduleForDisplay,
        groupTeamsByTable
    };
}