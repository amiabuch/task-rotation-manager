// src/supabase/client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema setup for Supabase SQL Editor:
/*
-- USERS Table (will sync with Kinde)
create table public.users (
    id uuid references auth.users not null primary key,
    email text not null unique,
    name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TASKS Table
create table public.tasks (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    cycle_interval integer not null,
    notify_day integer not null,
    created_by uuid references public.users not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TASK_ROTATION Table
create table public.task_rotation (
    id uuid default uuid_generate_v4() primary key,
    task_id uuid references public.tasks not null,
    user_id uuid references public.users not null,
    position integer not null,
    unique (task_id, user_id)
);

-- TASK_ASSIGNMENTS Table
create table public.task_assignments (
    id uuid default uuid_generate_v4() primary key,
    task_id uuid references public.tasks not null,
    user_id uuid references public.users not null,
    start_date timestamp with time zone default timezone('utc'::text, now()) not null,
    due_date timestamp with time zone not null,
    completed boolean default false,
    notification_sent boolean default false
);

-- NOTIFICATIONS Table
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users not null,
    task_id uuid references public.tasks not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    read boolean default false
);

-- Add row level security policies
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.task_rotation enable row level security;
alter table public.task_assignments enable row level security;
alter table public.notifications enable row level security;

-- Policies for users table
create policy "Users can view their own profile" 
on public.users for select using (auth.uid() = id);

-- Policies for tasks
create policy "Anyone can view tasks they're assigned to"
on public.tasks for select using (
    exists (
        select 1 from public.task_rotation
        where task_rotation.task_id = tasks.id
        and task_rotation.user_id = auth.uid()
    )
);

create policy "Users can create tasks"
on public.tasks for insert with check (auth.uid() = created_by);

-- Add more policies as needed
*/