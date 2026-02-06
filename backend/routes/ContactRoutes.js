// routes/contactRoutes.js
import express from "express";
import Contact from "../models/contactModel.js";
import { notifyContact, notifyStaff } from "../utils/notificationHelper.js";

const router = express.Router();

// GET all contact messages
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new contact message
router.post("/", async (req, res) => {
  try {
    const newContact = await Contact.create(req.body);
    
    // Send notifications
    // If user is logged in (has userId), notify them
    if (req.body.userId) {
      await notifyContact.submitted(
        req.body.userId,
        req.body.name,
        req.body.email
      );
    }
    
    // Always notify staff about new contact message
    await notifyStaff({
      title: 'New Contact Message',
      message: `${req.body.name} (${req.body.email}) has sent a new message.`,
      type: 'info',
      link: '/staff/contact'
    });
    
    res.status(201).json(newContact);
  } catch (err) {
    console.error("Error creating contact:", err);
    res.status(400).json({ message: err.message });
  }
});

export default router;