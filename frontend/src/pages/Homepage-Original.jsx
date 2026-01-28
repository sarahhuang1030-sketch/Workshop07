// tailwind css
// import React, { useState } from 'react';
// import { Smartphone, Wifi, Zap, Gift, TrendingUp, Headphones, Video, Music, Package, Users, Heart, Signal, Moon, Sun } from 'lucide-react';
// export default function TeleConnectVibrant() {
//     const [simport React, { useState } from 'react';
//         import { Smartphone, Wifi, Zap, Gift, TrendingUp, Headphones, Video, Music, Package, Users, Heart, Signal, Moon, Sun } from 'lucide-react';
//
//         export default function TeleConnectVibrant() {
//             const [selectedTab, setSelectedTab] = useState('mobile');
//             const [darkMode, setDarkMode] = useState(false);
//
//             const mobilePlans = [
//                 {
//                     id: 1,
//                     name: 'StartUp',
//                     tagline: 'Perfect for starters',
//                     data: '10GB',
//                     price: 35,
//                     color: 'from-cyan-400 to-blue-500',
//                     icon: Smartphone,
//                     perks: ['5G Speed', 'Free Music Streaming', 'Unlimited Texting', '100 Intl Minutes'],
//                     badge: null
//                 },
//                 {
//                     id: 2,
//                     name: 'StreamMax',
//                     tagline: 'For content lovers',
//                     data: '30GB',
//                     price: 55,
//                     color: 'from-purple-400 to-pink-500',
//                     icon: Video,
//                     perks: ['5G+ Speed', 'Free Video Streaming', 'Unlimited Everything', 'Social Media Data Free', 'Priority Support'],
//                     badge: '🔥 Hot Deal'
//                 },
//                 {
//                     id: 3,
//                     name: 'PowerPlay',
//                     tagline: 'Ultimate freedom',
//                     data: 'Unlimited',
//                     price: 75,
//                     color: 'from-orange-400 to-red-500',
//                     icon: Zap,
//                     perks: ['5G+ Ultra', 'All Streaming Free', 'Gaming Priority', 'Free Device Insurance', 'VIP Support', 'Free Netflix'],
//                     badge: '⚡ Best Value'
//                 }
//             ];
//
//             const addOns = [
//                 { icon: Music, name: 'Music Pass', price: 5, color: 'bg-gradient-to-br from-green-400 to-emerald-500' },
//                 { icon: Video, name: 'Video Pass', price: 8, color: 'bg-gradient-to-br from-red-400 to-pink-500' },
//                 { icon: Users, name: 'Family Share', price: 12, color: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
//                 { icon: Gift, name: 'Rewards+', price: 3, color: 'bg-gradient-to-br from-yellow-400 to-orange-500' }
//             ];
//
//             const features = [
//                 { icon: Signal, title: '5G+ Network', desc: 'Lightning fast speeds' },
//                 { icon: Headphones, title: '24/7 Support', desc: 'We\'re always here' },
//                 { icon: Gift, title: 'Earn Rewards', desc: 'Points with every payment' },
//                 { icon: Heart, title: 'No Contracts', desc: 'Cancel anytime, free' }
//             ];
//
//             return (
//         <div className={`min-h-screen transition-colors duration-300 ${
//             darkMode
//         ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
//         : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'
//         }`}>
//         {/* Header */}
//         <header className={`backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-colors ${
//             darkMode ? 'bg-gray-900/80 border-b border-gray-800' : 'bg-white/80 border-b border-gray-100'
//         }`}>
//         <div className="max-w-7xl mx-auto px-4 py-4">
//         <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-3">
//         <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
//         <Signal className="w-6 h-6 text-white" />
//         </div>
//         <div>
//         <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
//         TeleConnect
//         </h1>
//         <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stay Connected, Stay You</p>
//         </div>
//         </div>
//
//         <div className="hidden md:flex items-center space-x-6">
//         <button className={`font-medium transition-colors ${
//             darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-purple-600'
//         }`}>Plans</button>
//         <button className={`font-medium transition-colors ${
//             darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-purple-600'
//         }`}>Devices</button>
//         <button className={`font-medium transition-colors ${
//             darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-purple-600'
//         }`}>Perks</button>
//         <button
//         onClick={() => setDarkMode(!darkMode)}
//         className={`p-2 rounded-lg transition-colors ${
//             darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
//         }`}
//         >
//         {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
//         </button>
//         <button className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all">
//         Get Started
//         </button>
//         </div>
//         </div>
//         </div>
//         </header>
//
//         {/* Hero Section */}
//         <section className="py-12 px-4">
//         <div className="max-w-7xl mx-auto">
//         <div className={`rounded-3xl shadow-2xl overflow-hidden ${
//             darkMode
//         ? 'bg-gradient-to-br from-purple-800 via-pink-700 to-orange-700'
//         : 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500'
//         }`}>
//         <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
//         <div className="flex flex-col justify-center text-white">
//         <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-4 w-fit">
//         ✨ New Customer Offer
//         </div>
//         <h2 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
//         Stay Connected
//         <span className="block">On Your Terms</span>
//         </h2>
//         <p className={`text-xl mb-6 ${darkMode ? 'text-purple-100' : 'text-purple-100'}`}>
//         Get 3 months FREE + unlimited data on Canada's fastest 5G network
//         </p>
//         <div className="flex flex-wrap gap-3">
//         <button className="px-6 py-3 bg-white text-purple-600 rounded-full font-bold hover:scale-105 transition-transform shadow-lg">
//         See Plans
//         </button>
//         <button className={`px-6 py-3 backdrop-blur-sm text-white rounded-full font-bold transition-all border-2 border-white/30 ${
//             darkMode ? 'bg-purple-800/50 hover:bg-purple-800' : 'bg-purple-700/50 hover:bg-purple-700'
//         }`}>
//         Check Coverage
//         </button>
//         </div>
//         </div>
//
//         <div className="flex items-center justify-center">
//         <div className="relative">
//         <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full"></div>
//         <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30">
//         <div className="text-center mb-6">
//         <div className="text-6xl font-black text-white mb-2">$55</div>
//         <div className="text-white/80 text-lg">per month</div>
//         <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold mt-3 inline-block">
//         Save $45/month
//         </div>
//         </div>
//         <div className="space-y-3">
//         {['30GB 5G+ Data', 'Unlimited Calls & Texts', 'Free Streaming', 'Bonus Rewards'].map((item, idx) => (
//         <div key={idx} className="flex items-center space-x-2 text-white">
//         <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
//         <span className="text-xs">✓</span>
//         </div>
//         <span className="font-medium">{item}</span>
//         </div>
//         ))}
//         </div>
//         <button className="w-full mt-6 py-3 bg-white text-purple-600 rounded-full font-bold hover:scale-105 transition-transform">
//         Claim Offer
//         </button>
//         </div>
//         </div>
//         </div>
//         </div>
//         </div>
//         </div>
//         </section>
//
//         {/* Plan Tabs */}
//         <section className="max-w-7xl mx-auto px-4 py-8">
//         <div className={`flex justify-center space-x-2 rounded-2xl p-2 shadow-lg mb-8 ${
//             darkMode ? 'bg-gray-800' : 'bg-white'
//         }`}>
//         {['mobile', 'home', 'bundles'].map((tab) => (
//         <button
//         key={tab}
//         onClick={() => setSelectedTab(tab)}
//         className={`px-6 py-3 rounded-xl font-bold capitalize transition-all ${
//             selectedTab === tab
//         ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
//         : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
//         }`}
//         >
//         {tab === 'mobile' && '📱'} {tab === 'home' && '🏠'} {tab === 'bundles' && '🎁'} {tab}
//         </button>
//         ))}
//         </div>
//
//         {/* Plans Grid */}
//         <div className="grid md:grid-cols-3 gap-6 mb-12">
//         {mobilePlans.map((plan) => {
//             const Icon = plan.icon;
//             return (
//         <div
//         key={plan.id}
//         className={`rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all cursor-pointer ${
//             darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
//         }`}
//         >
//         {plan.badge && (
//         <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-center py-2 font-bold text-sm">
//         {plan.badge}
//         </div>
//         )}
//
//         <div className="p-6">
//         <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
//         <Icon className="w-8 h-8 text-white" />
//         </div>
//
//         <h3 className={`text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
//         <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{plan.tagline}</p>
//
//         <div className="mb-6">
//         <div className={`text-5xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//         ${plan.price}
//         </div>
//         <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>per month</div>
//         <div className={`text-3xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent mt-2`}>
//         {plan.data}
//         </div>
//         <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>high-speed data</div>
//         </div>
//
//         <div className="space-y-2 mb-6">
//         {plan.perks.map((perk, idx) => (
//         <div key={idx} className="flex items-center space-x-2">
//         <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
//         <span className="text-green-600 text-xs">✓</span>
//         </div>
//         <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{perk}</span>
//         </div>
//         ))}
//         </div>
//
//         <button className={`w-full py-3 bg-gradient-to-r ${plan.color} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all`}>
//         Choose Plan
//         </button>
//         </div>
//         </div>
//         );
//         })}
//         </div>
//         </section>
//
//         {/* Add-ons */}
//         <section className="max-w-7xl mx-auto px-4 py-8">
//         <h3 className={`text-3xl font-black text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//         Level Up Your Plan 🚀
//         </h3>
//         <div className="grid md:grid-cols-4 gap-4">
//         {addOns.map((addon, idx) => {
//             const Icon = addon.icon;
//             return (
//         <div
//         key={idx}
//         className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
//             darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
//         }`}
//         >
//         <div className={`w-12 h-12 ${addon.color} rounded-xl flex items-center justify-center mb-3`}>
//         <Icon className="w-6 h-6 text-white" />
//         </div>
//         <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{addon.name}</h4>
//         <div className="text-2xl font-black text-purple-600">+${addon.price}</div>
//         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>per month</div>
//         </div>
//         );
//         })}
//         </div>
//         </section>
//
//         {/* Features */}
//         <section className="max-w-7xl mx-auto px-4 py-12">
//         <div className={`rounded-3xl p-8 shadow-2xl ${
//             darkMode
//         ? 'bg-gradient-to-br from-blue-800 to-purple-800'
//         : 'bg-gradient-to-br from-blue-500 to-purple-600'
//         }`}>
//         <h3 className="text-3xl font-black text-white text-center mb-8">
//         Why Choose TeleConnect?
//         </h3>
//         <div className="grid md:grid-cols-4 gap-6">
//         {features.map((feature, idx) => {
//             const Icon = feature.icon;
//             return (
//         <div key={idx} className="text-center">
//         <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
//         <Icon className="w-8 h-8 text-white" />
//         </div>
//         <h4 className="font-bold text-white mb-2">{feature.title}</h4>
//         <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>{feature.desc}</p>
//         </div>
//         );
//         })}
//         </div>
//         </div>
//         </section>
//
//         {/* Stats */}
//         <section className="max-w-7xl mx-auto px-4 py-12">
//         <div className="grid md:grid-cols-4 gap-6 text-center">
//         <div className={`rounded-2xl p-6 shadow-lg ${
//             darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
//         }`}>
//         <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
//         10M+
//         </div>
//         <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Happy Customers</div>
//         </div>
//         <div className={`rounded-2xl p-6 shadow-lg ${
//             darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
//         }`}>
//         <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
//         99.9%
//         </div>
//         <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Network Uptime</div>
//         </div>
//         <div className={`rounded-2xl p-6 shadow-lg ${
//             darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
//         }`}>
//         <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
//         #1
//         </div>
//         <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>5G Coverage</div>
//         </div>
//         <div className={`rounded-2xl p-6 shadow-lg ${
//             darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
//         }`}>
//         <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
//         24/7
//         </div>
//         <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Support</div>
//         </div>
//         </div>
//         </section>
//
//         {/* CTA */}
//         <section className="max-w-4xl mx-auto px-4 py-12">
//         <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl">
//         <h3 className="text-4xl font-black mb-4">Ready to Connect?</h3>
//         <p className={`text-xl mb-8 ${darkMode ? 'text-purple-100' : 'text-purple-100'}`}>
//         Join millions who switched and never looked back
//         </p>
//         <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl">
//         Get Your Plan Now 🎉
//         </button>
//         </div>
//         </section>
//
//         {/* Footer */}
//         <footer className={`py-8 mt-12 ${
//             darkMode ? 'bg-black border-t border-gray-800' : 'bg-gray-900'
//         } text-white`}>
//         <div className="max-w-7xl mx-auto px-4 text-center">
//         <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>&copy; 2025 TeleConnect. Made with ❤️ in Canada</p>
//         </div>
//         </footer>
//         </div>
//         );
//         }electedTab, setSelectedTab] = useState('mobile'); const [darkMode, setDarkMode] = useState(false); const mobilePlans = [ { id: 1, name: 'StartUp', tagline: 'Perfect for starters', data: '10GB', price: 35, color: 'from-cyan-400 to-blue-500', icon: Smartphone, perks: ['5G Speed', 'Free Music Streaming', 'Unlimited Texting', '100 Intl Minutes'], badge: null }, { id: 2, name: 'StreamMax', tagline: 'For content lovers', data: '30GB', price: 55, color: 'from-purple-400 to-pink-500', icon: Video, perks: ['5G+ Speed', 'Free Video Streaming', 'Unlimited Everything', 'Social Media Data Free', 'Priority Support'], badge: '🔥 Hot Deal' }, { id: 3, name: 'PowerPlay', tagline: 'Ultimate freedom', data: 'Unlimited', price: 75, color: 'from-orange-400 to-red-500', icon: Zap, perks: ['5G+ Ultra', 'All Streaming Free', 'Gaming Priority', 'Free Device Insurance', 'VIP Support', 'Free Netflix'], badge: '⚡ Best Value' } ]; const addOns = [ { icon: Music, name: 'Music Pass', price: 5, color: 'bg-gradient-to-br from-green-400 to-emerald-500' }, { icon: Video, name: 'Video Pass', price: 8, color: 'bg-gradient-to-br from-red-400 to-pink-500' }, { icon: Users, name: 'Family Share', price: 12, color: 'bg-gradient-to-br from-blue-400 to-cyan-500' }, { icon: Gift, name: 'Rewards+', price: 3, color: 'bg-gradient-to-br from-yellow-400 to-orange-500' } ]; const features = [ { icon: Signal, title: '5G+ Network', desc: 'Lightning fast speeds' }, { icon: Headphones, title: '24/7 Support', desc: 'We\'re always here' }, { icon: Gift, title: 'Earn Rewards', desc: 'Points with every payment' }, { icon: Heart, title: 'No Contracts', desc: 'Cancel anytime, free' } ]; return ( <div className={min-h-screen transition-colors duration-300 ${ darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50' }}> {/* Header */} <header className={backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-colors ${ darkMode ? 'bg-gray-900/80 border-b border-gray-800' : 'bg-white/80 border-b border-gray-100' }}> <div className="max-w-7xl mx-auto px-4 py-4"> <div className="flex items-center justify-between"> <div className="flex items-center space-x-3"> <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"> <Signal className="w-6 h-6 text-white" /> </div> <div> <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> TeleConnect </h1> <p className={text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}}>Stay Connected, Stay You</p> </div> </div> <div className="hidden md:flex items-center space-x-6"> <button className={font-medium transition-colors ${ darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-purple-600' }}>Plans</button> <button className={font-medium transition-colors ${ darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-purple-600' }}>Devices</button> <button className={font-medium transition-colors ${ darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-purple-600' }}>Perks</button> <button onClick={() => setDarkMode(!darkMode)} className={p-2 rounded-lg transition-colors ${ darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200' }} > {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />} </button> <button className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"> Get Started </button> </div> </div> </div> </header> {/* Hero Section */} <section className="py-12 px-4"> <div className="max-w-7xl mx-auto"> <div className={rounded-3xl shadow-2xl overflow-hidden ${ darkMode ? 'bg-gradient-to-br from-purple-800 via-pink-700 to-orange-700' : 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500' }}> <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12"> <div className="flex flex-col justify-center text-white"> <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-4 w-fit"> ✨ New Customer Offer </div> <h2 className="text-5xl md:text-6xl font-black mb-4 leading-tight"> Stay Connected <span className="block">On Your Terms</span> </h2> <p className={text-xl mb-6 ${darkMode ? 'text-purple-100' : 'text-purple-100'}}> Get 3 months FREE + unlimited data on Canada's fastest 5G network </p> <div className="flex flex-wrap gap-3"> <button className="px-6 py-3 bg-white text-purple-600 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"> See Plans </button> <button className={px-6 py-3 backdrop-blur-sm text-white rounded-full font-bold transition-all border-2 border-white/30 ${ darkMode ? 'bg-purple-800/50 hover:bg-purple-800' : 'bg-purple-700/50 hover:bg-purple-700' }}> Check Coverage </button> </div> </div> <div className="flex items-center justify-center"> <div className="relative"> <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full"></div> <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30"> <div className="text-center mb-6"> <div className="text-6xl font-black text-white mb-2">$55</div> <div className="text-white/80 text-lg">per month</div> <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold mt-3 inline-block"> Save $45/month </div> </div> <div className="space-y-3"> {['30GB 5G+ Data', 'Unlimited Calls & Texts', 'Free Streaming', 'Bonus Rewards'].map((item, idx) => ( <div key={idx} className="flex items-center space-x-2 text-white"> <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center"> <span className="text-xs">✓</span> </div> <span className="font-medium">{item}</span> </div> ))} </div> <button className="w-full mt-6 py-3 bg-white text-purple-600 rounded-full font-bold hover:scale-105 transition-transform"> Claim Offer </button> </div> </div> </div> </div> </div> </div> </section> {/* Plan Tabs */} <section className="max-w-7xl mx-auto px-4 py-8"> <div className={flex justify-center space-x-2 rounded-2xl p-2 shadow-lg mb-8 ${ darkMode ? 'bg-gray-800' : 'bg-white' }}> {['mobile', 'home', 'bundles'].map((tab) => ( <button key={tab} onClick={() => setSelectedTab(tab)} className={px-6 py-3 rounded-xl font-bold capitalize transition-all ${ selectedTab === tab ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900' }} > {tab === 'mobile' && '📱'} {tab === 'home' && '🏠'} {tab === 'bundles' && '🎁'} {tab} </button> ))} </div> {/* Plans Grid */} <div className="grid md:grid-cols-3 gap-6 mb-12"> {mobilePlans.map((plan) => { const Icon = plan.icon; return ( <div key={plan.id} className={rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all cursor-pointer ${ darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white' }} > {plan.badge && ( <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-center py-2 font-bold text-sm"> {plan.badge} </div> )} <div className="p-6"> <div className={w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg}> <Icon className="w-8 h-8 text-white" /> </div> <h3 className={text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}}>{plan.name}</h3> <p className={text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}}>{plan.tagline}</p> <div className="mb-6"> <div className={text-5xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}}> ${plan.price} </div> <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>per month</div> <div className={text-3xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent mt-2}> {plan.data} </div> <div className={text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}}>high-speed data</div> </div> <div className="space-y-2 mb-6"> {plan.perks.map((perk, idx) => ( <div key={idx} className="flex items-center space-x-2"> <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"> <span className="text-green-600 text-xs">✓</span> </div> <span className={text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}}>{perk}</span> </div> ))} </div> <button className={w-full py-3 bg-gradient-to-r ${plan.color} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all}> Choose Plan </button> </div> </div> ); })} </div> </section> {/* Add-ons */} <section className="max-w-7xl mx-auto px-4 py-8"> <h3 className={text-3xl font-black text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}}> Level Up Your Plan 🚀 </h3> <div className="grid md:grid-cols-4 gap-4"> {addOns.map((addon, idx) => { const Icon = addon.icon; return ( <div key={idx} className={rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer ${ darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white' }} > <div className={w-12 h-12 ${addon.color} rounded-xl flex items-center justify-center mb-3}> <Icon className="w-6 h-6 text-white" /> </div> <h4 className={font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}}>{addon.name}</h4> <div className="text-2xl font-black text-purple-600">+${addon.price}</div> <div className={text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}}>per month</div> </div> ); })} </div> </section> {/* Features */} <section className="max-w-7xl mx-auto px-4 py-12"> <div className={rounded-3xl p-8 shadow-2xl ${ darkMode ? 'bg-gradient-to-br from-blue-800 to-purple-800' : 'bg-gradient-to-br from-blue-500 to-purple-600' }}> <h3 className="text-3xl font-black text-white text-center mb-8"> Why Choose TeleConnect? </h3> <div className="grid md:grid-cols-4 gap-6"> {features.map((feature, idx) => { const Icon = feature.icon; return ( <div key={idx} className="text-center"> <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30"> <Icon className="w-8 h-8 text-white" /> </div> <h4 className="font-bold text-white mb-2">{feature.title}</h4> <p className={text-sm ${darkMode ? 'text-blue-200' : 'text-blue-100'}}>{feature.desc}</p> </div> ); })} </div> </div> </section> {/* Stats */} <section className="max-w-7xl mx-auto px-4 py-12"> <div className="grid md:grid-cols-4 gap-6 text-center"> <div className={rounded-2xl p-6 shadow-lg ${ darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white' }}> <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"> 10M+ </div> <div className={font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}}>Happy Customers</div> </div> <div className={rounded-2xl p-6 shadow-lg ${ darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white' }}> <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2"> 99.9% </div> <div className={font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}}>Network Uptime</div> </div> <div className={rounded-2xl p-6 shadow-lg ${ darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white' }}> <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2"> #1 </div> <div className={font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}}>5G Coverage</div> </div> <div className={rounded-2xl p-6 shadow-lg ${ darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white' }}> <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2"> 24/7 </div> <div className={font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}}>Support</div> </div> </div> </section> {/* CTA */} <section className="max-w-4xl mx-auto px-4 py-12"> <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl"> <h3 className="text-4xl font-black mb-4">Ready to Connect?</h3> <p className={text-xl mb-8 ${darkMode ? 'text-purple-100' : 'text-purple-100'}}> Join millions who switched and never looked back </p> <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl"> Get Your Plan Now 🎉 </button> </div> </section> {/* Footer */} <footer className={py-8 mt-12 ${ darkMode ? 'bg-black border-t border-gray-800' : 'bg-gray-900' } text-white}> <div className="max-w-7xl mx-auto px-4 text-center"> <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>&copy; 2025 TeleConnect. Made with ❤️ in Canada</p> </div> </footer> </div> ); }