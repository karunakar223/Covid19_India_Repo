const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
app.use(express.json());

const stateObjects = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

const districtObjects = (districtObj) => {
  return {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running at 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.get("/states/", async (req, res) => {
  const getStatesQuery = `
        SELECT 
        * 
        FROM 
        state;
    `;
  const states = await db.all(getStatesQuery);
  res.send(states.map((eachState) => stateObjects(eachState)));
});

//API 2
app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `
        SELECT * FROM state 
        WHERE state_id = ${stateId};
    `;
  const state = await db.get(getStateQuery);
  res.send(stateObjects(state));
});

//API 3
app.post("/districts/", async (req, res) => {
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `
        INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
        VALUES
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(createDistrictQuery);
  res.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictQuery = `
        SELECT * FROM district
        WHERE district_id = ${districtId};
    `;
  const district = await db.get(getDistrictQuery);
  res.send(districtObjects(district));
});

//API 5
app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  res.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE 
        district 
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
            WHERE 
            district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  res.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const getStateDetailsQuery = `
        SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) As totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
        FROM district
        WHERE state_id = ${stateId};
    `;
  const stats = await db.get(getStateDetailsQuery);
  res.send(stats);
});

//API 8
app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictQuery = `
        SELECT state.state_name AS stateName
        FROM district
        NATURAL JOIN state
        WHERE district_id = ${districtId};
    `;
  const details = await db.get(getDistrictQuery);
  res.send(details);
});

module.exports = app;
