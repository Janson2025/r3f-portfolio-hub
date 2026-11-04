
import { FACES } from "../../block/constrants.js";
import { RUBIK_FACE_COLORS } from "../../shared/constants.js";

// Projects without an explicit priority use this value.
const DEFAULT_PRIORITY = 2;

// --------------------------------------------------
// Seeded random utilities
// --------------------------------------------------

function hashString(value) {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function createSeededRandom(seed) {
    let state = hashString(String(seed));

    return function random() {
        state += 0x6D2B79F5;

        let value = state;

        value = Math.imul(
            value ^ (value >>> 15),
            value | 1
        );

        value ^= value + Math.imul(
            value ^ (value >>> 7),
            value | 61
        );

        return (
            (value ^ (value >>> 14)) >>> 0
        ) / 4294967296;
    };
}

function shuffle(items, random) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));

        [result[i], result[j]] = [
            result[j],
            result[i],
        ];
    }

    return result;
}

// --------------------------------------------------
// Generate all exposed sticker positions
// --------------------------------------------------

function getExposedStickerPositions(dimensions) {
    const [dx, dy, dz] = dimensions;

    const positions = [];

    for (let i = 0; i < dx; i++) {
        for (let j = 0; j < dy; j++) {
            for (let k = 0; k < dz; k++) {
                for (const face of FACES) {
                    if (
                        face.isExposed(
                            i,
                            j,
                            k,
                            dx,
                            dy,
                            dz
                        )
                    ) {
                        positions.push({
                            block: [i, j, k],
                            face: face.name,
                        });
                    }
                }
            }
        }
    }

    return positions;
}

// --------------------------------------------------
// Group projects by priority
// --------------------------------------------------

function getPriorityGroups(projects) {
    const groups = new Map();

    for (const project of projects) {
        const priority = Number.isFinite(project.priority)
            ? project.priority
            : DEFAULT_PRIORITY;

        if (!groups.has(priority)) {
            groups.set(priority, []);
        }

        groups.get(priority).push(project);
    }

    return [...groups.entries()]
        .sort(([priorityA], [priorityB]) => priorityA - priorityB);
}

// --------------------------------------------------
// Select projects based on available capacity
// --------------------------------------------------

function selectProjects(projects, capacity, random) {
    const priorityGroups = getPriorityGroups(projects);
    const selected = [];

    for (const [, group] of priorityGroups) {
        if (selected.length >= capacity) {
            break;
        }

        const shuffledGroup = shuffle(group, random);

        const remainingSlots = capacity - selected.length;

        selected.push(
            ...shuffledGroup.slice(0, remainingSlots)
        );
    }

    return selected;
}

// --------------------------------------------------
// Public assignment function
// --------------------------------------------------

export function createProjectStickerOverrides({
    projects = [],
    dimensions = [3, 3, 3],
    seed = "rubix-portfolio-v1",
}) {
    if (
        !Array.isArray(dimensions) ||
        dimensions.length !== 3 ||
        dimensions.some(
            (dimension) =>
                !Number.isInteger(dimension) ||
                dimension < 1
        )
    ) {
        throw new Error(
            "Project assignment requires three positive integer dimensions."
        );
    }

    if (!Array.isArray(projects)) {
        throw new Error(
            "Project assignment requires a projects array."
        );
    }

    const [dx, dy, dz] = dimensions;

    // Include dimensions in the seed so changing cube
    // dimensions produces a new stable assignment.
    const assignmentSeed =
        `${seed}:${dx}x${dy}x${dz}`;

    const random = createSeededRandom(assignmentSeed);

    // 1. Generate available exterior sticker positions.
    const availablePositions =
        getExposedStickerPositions(dimensions);

    // 2. Select projects according to priority.
    const selectedProjects = selectProjects(
        projects,
        availablePositions.length,
        random
    );

    // 3. Randomize which exterior positions they occupy.
    const shuffledPositions = shuffle(
        availablePositions,
        random
    );

    // 4. Build the map consumed by useBlockStickers.
    const overrides = new Map();

    selectedProjects.forEach((project, index) => {
        const position = shuffledPositions[index];

        const [i, j, k] = position.block;

        const key = `${i},${j},${k}:${position.face}`;

        // Remove legacy manual placement fields.
        // The generated position is now authoritative.
        const {
            block: _oldBlock,
            face: _oldFace,
            ...projectConfig
        } = project;

        overrides.set(key, {
            ...projectConfig,

            // Preserve other preview settings, but use the
            // color belonging to this cube face.
            preview: {
                ...projectConfig.preview,
                color: RUBIK_FACE_COLORS[position.face],
            },

            block: position.block,
            face: position.face,
        });
    });

    return overrides;
}
