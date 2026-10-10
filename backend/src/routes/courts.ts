import express from "express";
import {db} from "../prisma/db.js"
import { asyncHandler } from "../middleware/asyncHandler.js";
const router = express.Router();


router.get("/", asyncHandler(async (req, res) => {
    const courts = await db.orm.public.Court
    .where({ isActive: true })
    .all();

    res.status(200).json({ courts });
}));


router.post("/", asyncHandler(async (req, res) => {
  const {name , type , description , features , pricePerHour , available , image , color} = req.body
if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({
        message: "invalid name"
    });
}
if (
    type !== undefined &&
    type !== null &&
    (typeof type !== "string" || type.trim().length === 0)
) {
    return res.status(400).json({
        message: "invalid type"
    });
}
if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
) {
    return res.status(400).json({
        message: "invalid description"
    });
}
if (
    !Array.isArray(features) ||
    !features.every(
        (feature) =>
            typeof feature === "string" &&
            feature.trim().length > 0
    )
) {
    return res.status(400).json({
        message: "invalid features"
    });
}
if (
    typeof pricePerHour !== "number" ||
    !Number.isInteger(pricePerHour) ||
    pricePerHour <= 0
) {
    return res.status(400).json({
        message: "invalid pricePerHour"
    });
}
  if (available !== undefined && typeof available !== "boolean") {
  return res.status(400).json({ message: "invalid available" });
}
if (
    image !== undefined &&
    image !== null &&
    typeof image !== "string"
) {
    return res.status(400).json({
        message: "invalid image"
    });
}
if (
    typeof color !== "string" ||
    !/^#[0-9A-Fa-f]{6}$/.test(color)
) {
    return res.status(400).json({
        message: "invalid color"
    });
}
const court = await db.orm.public.Court.create({
    name,
    type,
    description,
    features,
    pricePerHour,
    available,
    image,
    color
});

res.status(201).json({
    message: "Court created successfully",
    court
});
}));

router.get("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (typeof id !== "string") {
        return res.status(400).json({
            message: "invalid id"
        });
    }
const courtId = Number(id);

if (!Number.isInteger(courtId) || courtId <= 0) {
    return res.status(400).json({
        message: "invalid id"
    });
}
const court = await db.orm.public.Court.first({
    id: courtId,
    isActive: true
});

if (!court) {
    return res.status(404).json({
        message: "court not found"
    });
}

    res.status(200).json({ court });
}));

//update
router.patch("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (typeof id !== "string") {
        return res.status(400).json({
            message: "invalid id"
        });
    }

    const courtId = Number(id);

    if (!Number.isInteger(courtId) || courtId <= 0) {
        return res.status(400).json({
            message: "invalid id"
        });
    }

    const {
        name,
        type,
        description,
        features,
        pricePerHour,
        available,
        image,
        color
    } = req.body;

    // Validate name
    if (
        name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0)
    ) {
        return res.status(400).json({
            message: "invalid name"
        });
    }

    // Validate type
    if (
        type !== undefined &&
        type !== null &&
        (typeof type !== "string" || type.trim().length === 0)
    ) {
        return res.status(400).json({
            message: "invalid type"
        });
    }

    // Validate description
    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        return res.status(400).json({
            message: "invalid description"
        });
    }

    // Validate features
    if (
        features !== undefined &&
        (
            !Array.isArray(features) ||
            !features.every(
                (feature) =>
                    typeof feature === "string" &&
                    feature.trim().length > 0
            )
        )
    ) {
        return res.status(400).json({
            message: "invalid features"
        });
    }

    // Validate pricePerHour
if (
    pricePerHour !== undefined &&
    (
        typeof pricePerHour !== "number" ||
        !Number.isInteger(pricePerHour) ||
        pricePerHour <= 0
    )
) {
    return res.status(400).json({
        message: "invalid pricePerHour"
    });
}
    // Validate available
    if (
        available !== undefined &&
        typeof available !== "boolean"
    ) {
        return res.status(400).json({
            message: "invalid available"
        });
    }

    // Validate image
    if (
        image !== undefined &&
        image !== null &&
        typeof image !== "string"
    ) {
        return res.status(400).json({
            message: "invalid image"
        });
    }

    // Validate color
    if (
        color !== undefined &&
        (
            typeof color !== "string" ||
            !/^#[0-9A-Fa-f]{6}$/.test(color)
        )
    ) {
        return res.status(400).json({
            message: "invalid color"
        });
    }

    // Check whether court exists
    const existingCourt = await db.orm.public.Court.first({
        id: courtId
    });

    if (!existingCourt) {
        return res.status(404).json({
            message: "court not found"
        });
    }

    // Build update object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = features;
    if (pricePerHour !== undefined) updateData.pricePerHour = pricePerHour;
    if (available !== undefined) updateData.available = available;
    if (image !== undefined) updateData.image = image;
    if (color !== undefined) updateData.color = color;

    // Prevent empty PATCH request
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
            message: "no fields to update"
        });
    }

    const court = await db.orm.public.Court
        .where({ id: courtId })
        .update(updateData);

    res.status(200).json({
        message: "updated the court successfully",
        court
    });
}));

//delete
router.delete("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (typeof id !== "string") {
        return res.status(400).json({
            message: "invalid id"
        });
    }

const courtId = Number(id);

if (!Number.isInteger(courtId) || courtId <= 0) {
    return res.status(400).json({
        message: "invalid id"
    });
}

    const existingCourt = await db.orm.public.Court.first({
        id: courtId
    });

    if (!existingCourt) {
        return res.status(404).json({
            message: "court not found"
        });
    }

await db.orm.public.Court
    .where({ id: courtId })
    .update({
        available: false,
        isActive: false
    });

res.status(200).json({
    message: "court deactivated successfully"
});
}));
export default router 