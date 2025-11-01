import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard.jsx';

const API_BASE = 'https://linkdinclone-1.onrender.com/api';
const API_POSTS_URL = `${API_BASE}/posts/me`; // Endpoint to fetch current user's posts
const API_PROFILE_URL = `${API_BASE}/profile/me`; // Endpoint to fetch current user's profile

// Placeholder for User Profile data structure
const initialProfileState = {
    user: { name: '', email: '' },
    bio: 'No bio set yet.',
    location: 'Earth',
    social: {} 
};


const ProfilePage = ({ navigate }) => {
    const { getToken, user } = useAuth(); 
    const [posts, setPosts] = useState([]);
    const [profile, setProfile] = useState(initialProfileState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Handlers passed down to PostCard 

    const updatePostInState = (postId, updates) => {
        setPosts(prevPosts => 
            prevPosts.map(post => 
                post._id === postId ? { ...post, ...updates } : post
            )
        );
    };

    const handleUpdatePost = async (postId, newText) => {
        try {
            const token = getToken();
            const res = await axios.put(
                `${API_BASE}/posts/${postId}`, 
                { text: newText }, 
                { headers: { 'x-auth-token': token } }
            );

            updatePostInState(postId, { text: res.data.text });
            return { success: true };
        } catch (err) {
            console.error("Error updating post:", err);
            setError('Failed to update post.');
            return { success: false };
        }
    };
    
    const handleDeletePost = async (postId) => {
        try {
            const token = getToken();
            await axios.delete(`${API_BASE}/posts/${postId}`, { headers: { 'x-auth-token': token } });
            setPosts(posts.filter(post => post._id !== postId)); 
        } catch (err) {
            console.error("Error deleting post:", err);
            setError('Failed to delete post.');
        }
    };

    const handleLikePost = async (postId) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await axios.put(`${API_BASE}/posts/${postId}/like`, {}, { headers: { 'x-auth-token': token } });
            updatePostInState(postId, { likes: res.data.likes, dislikes: res.data.dislikes });
        } catch (err) {
            console.error("Error liking post:", err);
        }
    };

    const handleDislikePost = async (postId) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await axios.put(`${API_BASE}/posts/${postId}/dislike`, {}, { headers: { 'x-auth-token': token } });
            updatePostInState(postId, { likes: res.data.likes, dislikes: res.data.dislikes });
        } catch (err) {
            console.error("Error disliking post:", err);
        }
    };

    const handleAddComment = async (postId, text) => {
        const token = getToken();
        if (!token || !text.trim()) return;
        try {
            const res = await axios.post(`${API_BASE}/posts/comment/${postId}`, { text }, { headers: { 'x-auth-token': token } });
            updatePostInState(postId, { comments: res.data });
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await axios.delete(`${API_BASE}/posts/comment/${postId}/${commentId}`, { headers: { 'x-auth-token': token } });
            updatePostInState(postId, { comments: res.data });
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };
    
    // --- Data Fetching Logic ---
    const fetchProfileAndPosts = async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            setError("Please log in to view your profile.");
            return;
        }

        try {
            setError('');
            
            // 1. Fetch Profile Details
            const profileRes = await axios.get(API_PROFILE_URL, {
                headers: { 'x-auth-token': token },
            });

            // Normalize the incoming data to match the expected state structure
            const apiData = profileRes.data;
            const normalizedProfile = {
                // If the user object is missing (meaning the data is flat),
                // create it using top-level name/email properties.
                user: apiData.user || { name: apiData.name || '', email: apiData.email || '' },
                bio: apiData.bio || 'No bio set yet.',
                location: apiData.location || 'Earth',
                social: apiData.social || {}
            };
            setProfile(normalizedProfile);

            // 2. Fetch User's Posts
            const postsRes = await axios.get(API_POSTS_URL, {
                headers: { 'x-auth-token': token },
            });
            
            // FIX: Ensure the data is an array before setting state
            const postsData = postsRes.data;
            if (Array.isArray(postsData)) {
                 setPosts(postsData);
            } else if (postsData && Array.isArray(postsData.posts)) {
                // Handle case where API wraps the array in an object: { posts: [...] }
                 setPosts(postsData.posts);
            } else {
                // If it's not an array (e.g., a single object or undefined), default to an empty array.
                // Log a warning for unexpected API format.
                console.warn("API for user posts returned non-array data:", postsData);
                setPosts([]);
            }

        } catch (err) {
            console.error("Error fetching profile/posts:", err);
            setError('Could not fetch profile data or posts.');
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchProfileAndPosts(); 
    }, []);

    if (loading) return <h2 style={{textAlign: 'center', marginTop: '50px', color: '#0077b5'}}>Loading Profile...</h2>;
    if (error) return <h2 style={{color: 'red', textAlign: 'center', marginTop: '50px'}}>{error}</h2>;

    return (
        <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
            
            {/* --- Profile Header --- */}
            <div style={{ 
                textAlign: 'center', 
                padding: '30px', 
                marginBottom: '30px', 
                background: '#f8f9fa', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    backgroundColor: '#0077b5', 
                    color: 'white', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    fontWeight: 'bold', 
                    fontSize: '3em', 
                    margin: '0 auto 15px' 
                }}>
                    {/* Defensive rendering for name initial */}
                    {profile.user?.name ? profile.user.name[0] : 'U'}
                </div>
                {/* Defensive rendering for name */}
                <h1 style={{ margin: 0, color: '#333' }}>{profile.user?.name || 'Anonymous User'}</h1>
                <p style={{ margin: '5px 0 15px', color: '#6c757d', fontSize: '1em' }}>{profile.user?.email}</p>
                
                <p style={{ margin: '15px 0 0', padding: '10px', background: '#e9ecef', borderRadius: '6px', fontStyle: 'italic' }}>
                    **Bio:** {profile.bio}
                </p>
                <p style={{ margin: '5px 0 0', color: '#495057' }}>
                    **Location:** {profile.location}
                </p>
                {/* Edit Button Placeholder */}
                <button
                    onClick={() => console.log('Edit Profile functionality needs implementation.')}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }}
                >
                    Edit Profile
                </button>
            </div>

            {/* --- User's Posts Feed --- */}
            <h2 style={{ borderBottom: '2px solid #0077b5', paddingBottom: '10px', color: '#333' }}>Aapke Posts ({posts.length})</h2>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <PostCard 
                        key={post._id} 
                        post={post} 
                        currentUserId={user ? user.id : null} 
                        onDelete={handleDeletePost} 
                        onUpdate={handleUpdatePost} 
                        onLike={handleLikePost} 
                        onDislike={handleDislikePost} 
                        onAddComment={handleAddComment} 
                        onDeleteComment={handleDeleteComment} 
                    />
                ))
            ) : (
                <p style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>Aapne abhi tak koi post nahi kiya hai.</p>
            )}
        </div>
    );
};

export default ProfilePage;
