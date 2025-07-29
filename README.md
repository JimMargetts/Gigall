# Pool League Fixture Scheduler

A JavaScript-based fixture scheduling system for pool leagues that ensures fair scheduling while respecting table constraints.

## Features

- **Double Round-Robin**: Every team plays every other team twice (home and away)
- **Table Constraints**: Teams sharing a table cannot both be at home on the same night
- **Fair Distribution**: Automatically balances matches across weeks
- **Validation**: Built-in validation to ensure schedule correctness
- **Interactive UI**: HTML interface for testing and visualizing schedules

## Requirements Met

✅ Every team plays every other team twice (Home and Away)  
✅ Teams sharing a table cannot be at home on the same night  
✅ For 10 teams: Generates schedule with proper match distribution  
✅ Supports any number of teams with flexible table assignments  

## Files

- `pool-league-scheduler.js` - Core scheduling algorithms
- `pool-league-test.html` - Interactive web interface for testing
- `test-scheduler.js` - Node.js test script
- `README.md` - This documentation

## Usage

### Web Interface

1. Open `pool-league-test.html` in a web browser
2. Modify the team list if needed using the Team Editor
3. Click "Generate Schedule" to create fixtures
4. View the generated schedule and validation results

### Command Line Testing

```bash
node test-scheduler.js
```

### Programmatic Usage

```javascript
const scheduler = require('./pool-league-scheduler.js');

const teams = [
    { teamID: 1, name: "Team A", tableID: 1 },
    { teamID: 2, name: "Team B", tableID: 1 },
    // ... more teams
];

// Generate schedule
const schedule = scheduler.generateFixtureSchedule(teams);

// Validate results
const validation = scheduler.validateSchedule(schedule, teams);

// Format for display
const formattedSchedule = scheduler.formatScheduleForDisplay(schedule);
```

## Algorithm Overview

The scheduler uses a constrained round-robin approach:

1. **Match Generation**: Creates all possible home/away combinations
2. **Weekly Scheduling**: Groups matches into weeks while respecting constraints
3. **Table Validation**: Ensures no table has multiple home teams per week
4. **Optimization**: Attempts to distribute matches evenly across weeks

## Test Results

With the provided 10-team example:
- ✅ All 90 matches scheduled (10 × 9 = 90)
- ✅ Table constraints satisfied (max 1 home team per table per week)
- ✅ Schedule completed in 31 weeks
- ✅ Average of 2.9 matches per week

## Team Data Format

```javascript
{
    teamID: number,    // Unique identifier
    name: string,      // Team name
    tableID: number    // Table where team plays home games
}
```

## Table Constraints

The key constraint is that teams sharing a table cannot both be at home on the same night. This is because:
- Teams share physical tables for home games
- Only one team can use a table as "home" per night
- The algorithm ensures this constraint is never violated

## Example Schedule Output

```
Week 1:
  BFTC (Table 1) vs Pin Ups (Table 1)
  Black Sheep (Table 2) vs Misfits (Table 2)
  Red Lion A (Table 6) vs Red Lion B (Table 6)
  ...

Week 2:
  BFTC (Table 1) vs Black Sheep (Table 2)
  Misfits (Table 2) vs Pin Ups (Table 1)
  ...
```

## Validation Features

The system validates:
- Total match count correctness
- Table constraint compliance
- Match distribution statistics
- Team participation balance

## Browser Compatibility

The HTML interface works in all modern browsers and provides:
- Team management interface
- Real-time schedule generation
- Visual validation results
- Detailed statistics display