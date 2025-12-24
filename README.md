# AI Task Planner

Demo Website Link: https://ai-taskplanner-mlro6nuo2-bconti123s-projects.vercel.app/

An AI-assisted task manager built with **Next.js**, **Prisma**, and **PostgreSQL**, featuring a **server-side AI agent** that can create, list, update, and delete tasks using natural language via OpenAI tool calling.

---

## What this is

This project demonstrates how to build a **production-style AI assistant** that safely operates on application data.

Users can manage tasks in two ways:
1. A traditional task dashboard (forms, lists, buttons)
2. A natural language AI chat interface

Both interfaces operate on the **same backend and database**.

---

## Key Features

- Task CRUD (create, list, update, delete)
- AI assistant that understands natural language commands
- Server-side OpenAI tool calling (no AI logic in the client)
- Safe delete/update handling with ambiguity resolution
- Low-cost AI usage (gpt-4o-mini)
- Minimal, clean UI for demonstration

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS  
- **Backend:** Next.js API Routes  
- **Database:** PostgreSQL  
- **ORM:** Prisma  
- **AI:** OpenAI Responses API (tool calling)

---

## Architecture Overview


UI (Dashboard and AI Chat) -> Server-side AI agent (OpenAI Responses) -> Database (Prisma)  


### Why this architecture?

- AI logic is centralized on the server
- No OpenAI API keys in the browser
- One AI entry point (`/api/ai/chat`)
- Easy to add other clients later (mobile, Slack bot, etc.)
- Lower cost and safer execution

---

## AI Assistant Design

The AI assistant does not directly manipulate the database.

Instead, it:
1. Receives user input
2. Decides whether to call a tool (e.g. `create_task`, `update_task`)
3. The server executes the tool safely
4. Results are returned to the AI for a final response

### Supported AI actions

- Create tasks
- List tasks
- Update task fields
- Delete tasks safely

### Safety features

- Title → ID resolution
- Case-insensitive matching
- Partial title matching
- Ambiguity detection (asks user to choose when needed)
- Graceful handling of missing or invalid data

---

## Example Prompts

Create: Finish this task

List: List all tasks

Update: Mark task as DONE

Delete: Delete the task Finish this task


---

## Why Server-Side AI?

This project intentionally avoids calling OpenAI from the client.

Benefits:
- Prevents API key exposure
- Avoids duplicated AI logic
- Makes auditing and cost control easier
- Matches real production patterns

---

## Status

This project is complete through:
- Backend AI agent
- CRUD task dashboard
- Minimal AI chat UI
- End-to-end working flow

Further enhancements (auth, streaming, real-time sync) are possible but intentionally out of scope.

---

## Author Notes

This project focuses on **correct architecture and safety**, not flashy UI.

The goal was to demonstrate:
- AI tool calling done properly
- Real database interaction
- Thoughtful error handling
- Practical, low-cost AI usage

---