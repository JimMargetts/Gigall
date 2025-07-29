const scheduler = require('./pool-league-scheduler.js');

// Test teams data
const teams = [
    { teamID: 9, name: "BFTC", tableID: 1 },
    { teamID: 16, name: "Pin Ups", tableID: 1 },
    { teamID: 1, name: "Black Sheep", tableID: 2 },
    { teamID: 17, name: "Misfits", tableID: 2 },
    { teamID: 7, name: "Red Lion A", tableID: 6 },
    { teamID: 21, name: "Red Lion B", tableID: 6 },
    { teamID: 19, name: "Riff Raff", tableID: 5 },
    { teamID: 2, name: "Pussy", tableID: 7 },
    { teamID: 20, name: "3 Gees", tableID: 8 },
    { teamID: 18, name: "Gizmos", tableID: 8 }
];

console.log('Pool League Fixture Scheduler Test');
console.log('==================================');
console.log(`Testing with ${teams.length} teams`);
console.log(`Expected matches: ${teams.length * (teams.length - 1)} (each team plays each other team twice)`);
console.log(`Expected games per week: ${Math.floor(teams.length / 2)}`);
console.log();

// Generate schedule
console.log('Generating schedule...');
const schedule = scheduler.generateFixtureSchedule(teams);

// Validate schedule
console.log('Validating schedule...');
const validation = scheduler.validateSchedule(schedule, teams);

// Display results
console.log('\nValidation Results:');
console.log('==================');
console.log(`Valid: ${validation.valid ? 'YES' : 'NO'}`);

if (validation.errors.length > 0) {
    console.log('\nErrors:');
    validation.errors.forEach(error => console.log(`- ${error}`));
}

console.log('\nStatistics:');
console.log(`- Total weeks: ${validation.stats.totalWeeks}`);
console.log(`- Total matches: ${validation.stats.totalMatches}`);
console.log(`- Expected matches: ${validation.stats.expectedMatches}`);
console.log(`- Average matches per week: ${(validation.stats.totalMatches / validation.stats.totalWeeks).toFixed(1)}`);

// Display table groups
console.log('\nTable Groups:');
const tableGroups = scheduler.groupTeamsByTable(teams);
Object.keys(tableGroups).forEach(tableID => {
    console.log(`Table ${tableID}: ${tableGroups[tableID].map(t => t.name).join(', ')}`);
});

// Display first few weeks of schedule
console.log('\nFirst 5 weeks of schedule:');
console.log('==========================');
const formattedSchedule = scheduler.formatScheduleForDisplay(schedule);
formattedSchedule.slice(0, 5).forEach(week => {
    console.log(`\nWeek ${week.week}:`);
    week.matches.forEach(match => {
        console.log(`  ${match.homeTeam} (Table ${match.homeTableID}) vs ${match.awayTeam} (Table ${match.awayTableID})`);
    });
});

if (formattedSchedule.length > 5) {
    console.log(`\n... and ${formattedSchedule.length - 5} more weeks`);
}

// Check table constraint compliance
console.log('\nTable Constraint Check:');
console.log('======================');
let constraintViolations = 0;
schedule.forEach((week, weekIndex) => {
    const homeTeamsPerTable = {};
    week.matches.forEach(match => {
        const tableID = match.homeTeam.tableID;
        homeTeamsPerTable[tableID] = (homeTeamsPerTable[tableID] || 0) + 1;
    });
    
    Object.keys(homeTeamsPerTable).forEach(tableID => {
        if (homeTeamsPerTable[tableID] > 1) {
            console.log(`Week ${week.week}: Table ${tableID} has ${homeTeamsPerTable[tableID]} home teams`);
            constraintViolations++;
        }
    });
});

if (constraintViolations === 0) {
    console.log('✓ All table constraints satisfied - no table has more than 1 home team per week');
} else {
    console.log(`✗ Found ${constraintViolations} table constraint violations`);
}