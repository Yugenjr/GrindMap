# Mentorship Marketplace & Session Booking System

This document describes the Mentorship Marketplace & Session Booking System feature implemented in the GrindMap project.

## Overview

The Mentorship Marketplace allows high-ranking users to offer mentorship sessions to other users. The system includes comprehensive booking management with timezone handling, availability management, and session tracking.

## Features

### 1. Mentor Profile Management
- Apply to become a mentor
- Set expertise areas and hourly rates
- Manage availability time slots
- Profile approval workflow

### 2. Session Booking System
- Browse mentors by expertise, rating, and availability
- Book sessions with timezone conversion
- Session status management (scheduled, confirmed, completed, etc.)
- Payment handling (points-based system)

### 3. Timezone Handling
- Automatic timezone conversion utilities
- Display times in user's local timezone
- Accurate scheduling across different timezones

### 4. Session Management
- Track session history
- Rate and review completed sessions
- Cancel bookings when necessary
- Status updates for ongoing sessions

## Models

### MentorProfile
- `userId`: Reference to the user account
- `expertise`: Array of expertise areas
- `hourlyRate`: Points charged per hour
- `bio`: Mentor biography
- `rating`: Average rating from mentees
- `availability`: Array of available time slots
- `status`: Application/approval status

### MentorshipSession
- `mentorId`: Reference to mentor profile
- `menteeId`: Reference to mentee user
- `scheduledAt`: Scheduled date/time
- `duration`: Session duration in minutes
- `timezone`: Timezone for the session
- `status`: Current session status
- `meetingLink`: Video call link
- `amountPaid`: Points paid for the session

## API Endpoints

### Mentor Applications
- `POST /api/mentorship/apply` - Apply to become a mentor
- `GET /api/mentorship/profile/:id` - Get mentor profile

### Mentor Search & Discovery
- `GET /api/mentorship/search` - Search for mentors with filters

### Session Booking
- `POST /api/mentorship/book` - Book a mentorship session
- `PUT /api/mentorship/availability` - Update mentor availability
- `DELETE /api/mentorship/session/:id` - Cancel a session
- `PUT /api/mentorship/session/:id/status` - Update session status
- `POST /api/mentorship/session/:id/rate` - Rate a completed session

### Session Management
- `GET /api/mentorship/sessions/mentor` - Get mentor's sessions
- `GET /api/mentorship/sessions/mentee` - Get mentee's sessions

## Timezone Utilities

The system includes comprehensive timezone conversion utilities:
- Convert times between different timezones
- Format times with appropriate timezone indicators
- Handle availability slots across different timezones

## Implementation Details

### Security
- All endpoints require JWT authentication
- Users can only access their own data
- Mentor profiles are moderated with approval workflow

### Data Validation
- Comprehensive validation for all inputs
- Prevention of double-bookings
- Validation of time slots against mentor availability

### Error Handling
- Proper error responses with appropriate status codes
- Transactional operations to prevent data inconsistency
- Detailed error messages for debugging

## Future Enhancements

- Integration with video conferencing APIs
- Automated reminder system
- Advanced analytics dashboard for mentors
- Group mentoring sessions
- Recording and note-taking features
- Integration with calendar applications