"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { 
  User, 
  Mail, 
  Smile,
  Coffee,
  Lightbulb,
  Heart,
  RefreshCw,
  Calendar,
  MapPin,
  Briefcase,
  Star
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { toast } from "sonner";

// Fun facts and jokes data
const funFacts = [
  "Did you know? The first computer bug was an actual bug - a moth trapped in a relay in 1947! 🐛",
  "Fun fact: There are more possible games of chess than atoms in the observable universe! ♟️",
  "Amazing: Honey never spoils! Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old and still edible! 🍯",
  "Cool fact: Octopuses have three hearts and blue blood! 🐙",
  "Weird but true: Bananas are berries, but strawberries aren't! 🍌🍓",
  "Mind-blowing: If you could fold a piece of paper 42 times, it would reach the moon! 🌙",
  "Incredible: A group of flamingos is called a 'flamboyance'! 🦩",
  "Fascinating: The human brain contains approximately 86 billion neurons! 🧠",
  "Amazing: Lightning strikes the Earth about 100 times per second! ⚡",
  "Cool: The shortest war in history lasted only 38-45 minutes! ⏰"
];

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 💻",
  "How many programmers does it take to change a light bulb? None. That's a hardware problem! 💡",
  "Why don't scientists trust atoms? Because they make up everything! ⚛️",
  "What do you call a fake noodle? An impasta! 🍝",
  "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
  "What do you call a bear with no teeth? A gummy bear! 🐻",
  "Why don't eggs tell jokes? They'd crack each other up! 🥚",
  "What do you call a sleeping bull? A bulldozer! 🐂",
  "Why did the math book look so sad? Because it was full of problems! 📚",
  "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks! 🦕"
];

const motivationalQuotes = [
  "You're doing great! Keep processing those invoices like a champion! 🏆",
  "Every PDF you process brings you one step closer to mastery! 📈",
  "Your attention to detail makes all the difference! ✨",
  "Keep up the excellent work - you're making data beautiful! 🎨",
  "You're not just processing invoices, you're creating order from chaos! 🌟",
  "Your dedication to accuracy is truly admirable! 👏",
  "Remember: Every expert was once a beginner. You're already amazing! 🚀"
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: user?.name || "John Doe",
    email: user?.email || "john.doe@example.com",
    displayName: user?.name || "John Doe",
    bio: "PDF processing enthusiast and data organization expert",
    location: "Remote Office",
    joinDate: "January 2024",
    role: user?.role || "user"
  });
  
  const [currentFact, setCurrentFact] = useState(funFacts[0]);
  const [currentJoke, setCurrentJoke] = useState(jokes[0]);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);

  // Initialize random content after hydration to prevent mismatch
  useEffect(() => {
    setCurrentFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    setCurrentJoke(jokes[Math.floor(Math.random() * jokes.length)]);
    setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const getRandomFact = () => {
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    setCurrentFact(randomFact);
    toast.success("New fun fact loaded! 🧠");
  };

  const getRandomJoke = () => {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    setCurrentJoke(randomJoke);
    toast.success("Hope that made you smile! 😄");
  };

  const getRandomQuote = () => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);
    toast.success("Stay motivated! 💪");
  };

  const handleSaveProfile = () => {
    // In a real app, this would save to the backend
    toast.success("Profile updated successfully! ✅");
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Your personal dashboard and fun zone</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {profile.role}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        PDF Expert
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({...profile, username: e.target.value})}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                      placeholder="Enter display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      placeholder="Your location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{profile.joinDate}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-gray-600">PDFs Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-gray-600">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">24</div>
                    <div className="text-sm text-gray-600">Days Active</div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700">
                  Save Profile Changes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Fun Zone */}
          <div className="space-y-6">
            {/* Fun Fact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Lightbulb className="h-5 w-5" />
                  Fun Fact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 text-sm leading-relaxed">{currentFact}</p>
                </div>
                <Button onClick={getRandomFact} variant="outline" className="w-full border-yellow-300 hover:bg-yellow-50">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Fact
                </Button>
              </CardContent>
            </Card>

            {/* Joke Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Smile className="h-5 w-5" />
                  Daily Laugh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 text-sm leading-relaxed">{currentJoke}</p>
                </div>
                <Button onClick={getRandomJoke} variant="outline" className="w-full border-green-300 hover:bg-green-50">
                  <Smile className="h-4 w-4 mr-2" />
                  Tell Another
                </Button>
              </CardContent>
            </Card>

            {/* Motivation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Heart className="h-5 w-5" />
                  Motivation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 text-sm leading-relaxed font-medium text-center">
                    {currentQuote}
                  </p>
                </div>
                <Button onClick={getRandomQuote} variant="outline" className="w-full border-red-300 hover:bg-red-50">
                  <Heart className="h-4 w-4 mr-2" />
                  Inspire Me
                </Button>
              </CardContent>
            </Card>

            {/* Coffee Break Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brown-600">
                  <Coffee className="h-5 w-5" />
                  Break Reminder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4">
                  <Coffee className="h-12 w-12 text-brown-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">
                    Remember to take breaks and stay hydrated! ☕
                  </p>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                    💡 Pro tip: The 20-20-20 rule - Every 20 minutes, look at something 20 feet away for 20 seconds!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
