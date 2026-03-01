import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/user.model.js';

const configurePassport = () => {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: "/api/auth/github/callback",
                scope: ['user:email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists by githubId
                    let user = await User.findOne({ githubId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists by email
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

                    if (email) {
                        user = await User.findOne({ email });
                        if (user) {
                            user.githubId = profile.id;
                            if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // Create new user
                    if (!email) {
                        return done(new Error("No email found from GitHub"), null);
                    }

                    user = await User.create({
                        name: profile.displayName || profile.username,
                        email: email,
                        githubId: profile.id,
                        avatar: profile.photos?.[0]?.value,
                        isEmailVerified: true // GitHub emails are verified
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
};

export default configurePassport;
