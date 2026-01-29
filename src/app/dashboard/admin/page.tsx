'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import {
    Users,
    GraduationCap,
    Shield,
    Building2,
    BookOpen,
    Plus,
    Trash2,
    Edit2,
    Search,
    UserPlus,
    BarChart3,
    LogOut,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adminService, { Student, Professor, Class, Branch } from '@/lib/adminService';

type TabType = 'overview' | 'students' | 'professors' | 'classes' | 'branches';

export default function AdminDashboard() {
    const { isAdmin, adminSession, logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Data states from Firebase
    const [students, setStudents] = useState<Student[]>([]);
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState<'student' | 'professor' | 'class' | 'branch'>('student');
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState<any>({});
    const [formError, setFormError] = useState('');

    // STRICT ACCESS CONTROL - Admin Only
    useEffect(() => {
        if (!isAdmin && !adminSession) {
            console.log('❌ Access denied: Non-admin attempting to access admin dashboard');
            router.push('/');
            return;
        }

        if (isAdmin && adminSession) {
            console.log('✅ Admin access granted:', adminSession.email);
            loadAllData();
        }
    }, [isAdmin, adminSession, router]);

    // Load all data from Firebase
    const loadAllData = async () => {
        try {
            setLoading(true);
            const [studentsData, professorsData, classesData, branchesData] = await Promise.all([
                adminService.getStudents(),
                adminService.getProfessors(),
                adminService.getClasses(),
                adminService.getBranches()
            ]);

            setStudents(studentsData);
            setProfessors(professorsData);
            setClasses(classesData);
            setBranches(branchesData);

            console.log('✅ Admin dashboard data loaded');
        } catch (error) {
            console.error('❌ Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const openAddModal = (type: 'student' | 'professor' | 'class' | 'branch') => {
        setModalType(type);
        setFormData({});
        setFormError('');
        setShowAddModal(true);
    };

    const handleAddItem = async () => {
        setFormError('');
        setSaving(true);

        try {
            switch (modalType) {
                case 'student':
                    if (!formData.name || !formData.email || !formData.department || !formData.year || !formData.password || !formData.classId) {
                        throw new Error('Please fill in all required fields, including password and class');
                    }
                    // Find the class name based on classId
                    const selectedClass = classes.find(c => c.id === formData.classId);
                    await adminService.createStudent({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        department: formData.department,
                        year: formData.year,
                        classId: formData.classId,
                        className: selectedClass?.name || '',
                        status: 'active'
                    });
                    break;

                case 'professor':
                    if (!formData.name || !formData.email || !formData.department || !formData.password) {
                        throw new Error('Please fill in all required fields, including password');
                    }
                    await adminService.createProfessor({
                        name: formData.name,
                        email: formData.email,
                        department: formData.department,
                        courses: [],
                        status: 'active',
                        password: formData.password
                    });
                    break;

                case 'class':
                    if (!formData.name || !formData.title || !formData.department) {
                        throw new Error('Please fill in all required fields');
                    }
                    await adminService.createClass({
                        name: formData.name,
                        title: formData.title,
                        department: formData.department,
                        professorName: formData.professor || '',
                        studentCount: 0,
                        status: 'active'
                    });
                    break;

                case 'branch':
                    if (!formData.name || !formData.code) {
                        throw new Error('Please fill in all required fields');
                    }
                    await adminService.createBranch({
                        name: formData.name,
                        code: formData.code.toUpperCase(),
                        studentCount: 0,
                        professorCount: 0
                    });
                    break;
            }

            // Reload data and close modal
            await loadAllData();
            setShowAddModal(false);
            setFormData({});
        } catch (error: any) {
            console.error('Error adding item:', error);
            setFormError(error.message || 'Failed to add item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async (type: string, id: string) => {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

        try {
            switch (type) {
                case 'student':
                    await adminService.deleteStudent(id);
                    setStudents(students.filter(s => s.id !== id));
                    break;
                case 'professor':
                    await adminService.deleteProfessor(id);
                    setProfessors(professors.filter(p => p.id !== id));
                    break;
                case 'class':
                    await adminService.deleteClass(id);
                    setClasses(classes.filter(c => c.id !== id));
                    break;
                case 'branch':
                    await adminService.deleteBranch(id);
                    setBranches(branches.filter(b => b.id !== id));
                    break;
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProfessors = professors.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Manage students, professors, classes, and branches
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        disabled={refreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{adminSession?.name}</p>
                        <p className="text-xs text-slate-500">{adminSession?.email}</p>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'students', label: 'Students', icon: GraduationCap },
                    { id: 'professors', label: 'Professors', icon: Shield },
                    { id: 'classes', label: 'Classes', icon: BookOpen },
                    { id: 'branches', label: 'Branches', icon: Building2 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as TabType); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Total Students</p>
                                    <p className="text-3xl font-bold text-blue-900 mt-1">{students.length}</p>
                                </div>
                                <GraduationCap className="w-12 h-12 text-blue-500" />
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Total Professors</p>
                                    <p className="text-3xl font-bold text-purple-900 mt-1">{professors.length}</p>
                                </div>
                                <Shield className="w-12 h-12 text-purple-500" />
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-emerald-600 font-medium">Active Classes</p>
                                    <p className="text-3xl font-bold text-emerald-900 mt-1">{classes.length}</p>
                                </div>
                                <BookOpen className="w-12 h-12 text-emerald-500" />
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600 font-medium">Departments</p>
                                    <p className="text-3xl font-bold text-orange-900 mt-1">{branches.length}</p>
                                </div>
                                <Building2 className="w-12 h-12 text-orange-500" />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Quick Actions */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button
                                onClick={() => openAddModal('student')}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Student
                            </Button>
                            <Button
                                onClick={() => openAddModal('professor')}
                                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Professor
                            </Button>
                            <Button
                                onClick={() => openAddModal('class')}
                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3"
                            >
                                <Plus className="w-4 h-4" />
                                Add Class
                            </Button>
                            <Button
                                onClick={() => openAddModal('branch')}
                                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3"
                            >
                                <Plus className="w-4 h-4" />
                                Add Branch
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Students</h3>
                            {students.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No students added yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {students.slice(0, 5).map(student => (
                                        <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{student.name}</p>
                                                    <p className="text-xs text-slate-500">{student.department}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${student.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Department Overview</h3>
                            {branches.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No departments added yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {branches.map(branch => (
                                        <div key={branch.id} className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-medium text-slate-800">{branch.name}</p>
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                    {branch.code}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-sm text-slate-600">
                                                <span>{branch.studentCount} students</span>
                                                <span>{branch.professorCount} professors</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={() => openAddModal('student')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Student
                        </Button>
                    </div>

                    <GlassCard className="overflow-hidden">
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                                <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No students found</p>
                                <Button
                                    onClick={() => openAddModal('student')}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Add First Student
                                </Button>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Department</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Year</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <GraduationCap className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium text-slate-800">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{student.email}</td>
                                            <td className="px-6 py-4 text-slate-600">{student.department}</td>
                                            <td className="px-6 py-4 text-slate-600">{student.year}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded ${student.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteItem('student', student.id!)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </GlassCard>
                </div>
            )}

            {/* Professors Tab */}
            {activeTab === 'professors' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search professors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={() => openAddModal('professor')}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Professor
                        </Button>
                    </div>

                    {filteredProfessors.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No professors found</p>
                            <Button
                                onClick={() => openAddModal('professor')}
                                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Add First Professor
                            </Button>
                        </GlassCard>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProfessors.map(professor => (
                                <GlassCard key={professor.id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Shield className="w-7 h-7 text-purple-600" />
                                        </div>
                                        <button
                                            onClick={() => handleDeleteItem('professor', professor.id!)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg">{professor.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{professor.email}</p>
                                    <p className="text-sm text-purple-600 mt-2">{professor.department}</p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {professor.courses.map(course => (
                                            <span key={course} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                {course}
                                            </span>
                                        ))}
                                        {professor.courses.length === 0 && (
                                            <span className="text-xs text-slate-400">No courses assigned</span>
                                        )}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-800">Manage Classes</h2>
                        <Button
                            onClick={() => openAddModal('class')}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="w-4 h-4" />
                            Add Class
                        </Button>
                    </div>

                    {classes.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No classes found</p>
                            <Button
                                onClick={() => openAddModal('class')}
                                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Add First Class
                            </Button>
                        </GlassCard>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map(cls => (
                                <GlassCard key={cls.id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-2xl font-bold text-emerald-600">{cls.name}</span>
                                        <button
                                            onClick={() => handleDeleteItem('class', cls.id!)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-800">{cls.title}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{cls.department}</p>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Users className="w-4 h-4" />
                                            {cls.studentCount} students
                                        </div>
                                        <p className="text-xs text-purple-600">{cls.professorName || 'No professor'}</p>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Branches Tab */}
            {activeTab === 'branches' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-800">Manage Departments/Branches</h2>
                        <Button
                            onClick={() => openAddModal('branch')}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Plus className="w-4 h-4" />
                            Add Branch
                        </Button>
                    </div>

                    {branches.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No branches/departments found</p>
                            <Button
                                onClick={() => openAddModal('branch')}
                                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                Add First Branch
                            </Button>
                        </GlassCard>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {branches.map(branch => (
                                <GlassCard key={branch.id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{branch.name}</h3>
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                                    {branch.code}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteItem('branch', branch.id!)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-blue-600">{branch.studentCount}</p>
                                            <p className="text-xs text-slate-500 mt-1">Students</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-purple-600">{branch.professorCount}</p>
                                            <p className="text-xs text-slate-500 mt-1">Professors</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => !saving && setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-6">
                                Add New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                            </h2>

                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-4">
                                {modalType === 'student' && (
                                    <>
                                        <Input
                                            placeholder="Full Name *"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={saving}
                                        />
                                        <Input
                                            placeholder="Email *"
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            disabled={saving}
                                        />
                                        <Input
                                            placeholder="Password (for login) *"
                                            type="password"
                                            value={formData.password || ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            disabled={saving}
                                        />
                                        <select
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            <option value="">Select Department *</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.name}>{b.name}</option>
                                            ))}
                                            {branches.length === 0 && (
                                                <option value="" disabled>Add branches first</option>
                                            )}
                                        </select>
                                        <select
                                            value={formData.year || ''}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            <option value="">Select Year *</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                        <select
                                            value={formData.classId || ''}
                                            onChange={(e) => {
                                                const selectedClass = classes.find(c => c.id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    classId: e.target.value,
                                                    className: selectedClass?.name || ''
                                                });
                                            }}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            <option value="">Select Class *</option>
                                            {classes.filter(c => c.status === 'active').map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} - {c.title} ({c.department})
                                                </option>
                                            ))}
                                            {classes.length === 0 && (
                                                <option value="" disabled>Add classes first</option>
                                            )}
                                        </select>
                                    </>
                                )}

                                {modalType === 'professor' && (
                                    <>
                                        <Input
                                            placeholder="Full Name (e.g., Dr. John Smith) *"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={saving}
                                        />
                                        <Input
                                            placeholder="Email *"
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            disabled={saving}
                                        />
                                        <Input
                                            placeholder="Password (for login) *"
                                            type="password"
                                            value={formData.password || ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            disabled={saving}
                                        />
                                        <select
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            <option value="">Select Department *</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.name}>{b.name}</option>
                                            ))}
                                            {branches.length === 0 && (
                                                <option value="" disabled>Add branches first</option>
                                            )}
                                        </select>
                                    </>
                                )}

                                {modalType === 'class' && (
                                    <>
                                        <Input
                                            placeholder="Class Code (e.g., CS101) *"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={saving}
                                        />
                                        <Input
                                            placeholder="Class Title *"
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            disabled={saving}
                                        />
                                        <select
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            <option value="">Select Department *</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.name}>{b.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={formData.professor || ''}
                                            onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            <option value="">Assign Professor (optional)</option>
                                            {professors.map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                {modalType === 'branch' && (
                                    <>
                                        <Input
                                            placeholder="Branch Name (e.g., Computer Science) *"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={saving}
                                        />
                                        <Input
                                            placeholder="Branch Code (e.g., CS) *"
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            disabled={saving}
                                        />
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={() => setShowAddModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddItem}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        `Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
