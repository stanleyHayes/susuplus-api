const Contribution = require("../models/contribution");
const Disbursement = require("../models/disbursement");
const GroupMember = require("../models/group-member");
const SusuMember = require("../models/susu-member");
const moment = require("moment");
const Invitation = require("../models/invitation");

exports.getDashboard = async (req, res) => {

    try {
        const totalContributions = await Contribution.find({contributor: req.user._id}).countDocuments();
        const totalDisbursements = await Disbursement.find({recipient: req.user._id}).countDocuments();

        let totalContributionsAmount = 0;
        let totalDisbursementsAmount = 0;

        const latestContributions = await Contribution
            .find({contributor: req.user._id})
            .limit(5)
            .sort({createdAt: -1});

        const latestDisbursements = await Disbursement
            .find({recipient: req.user._id})
            .limit(5)
            .sort({createdAt: -1});

        const acceptedInvitations = await Invitation.find({invitee: req.user._id, status: 'ACCEPTED'}).countDocuments();
        const rejectedInvitations = await Invitation.find({invitee: req.user._id, status: 'REJECTED'}).countDocuments();
        const expiredInvitations = await Invitation.find({invitee: req.user._id, status: 'EXPIRED'}).countDocuments();
        const totalInvitations = await Invitation.find({invitee: req.user._id}).countDocuments();

        const acceptancePercentage = totalInvitations === 0 ? 0 : (acceptedInvitations / totalInvitations * 100);
        const rejectedPercentage = totalInvitations === 0 ? 0 : (rejectedInvitations / totalInvitations * 100);
        const expiredPercentage = totalInvitations === 0 ? 0 : (expiredInvitations / totalInvitations * 100);

        const totalUserGroups = await GroupMember.find({user: req.user._id}).countDocuments();
        const totalUserSusu = await SusuMember.find({user: req.user._id}).countDocuments();

        const allUserContributions = await Contribution.find({contributor: req.user._id}).sort({createdAt: -1});
        const allUserDisbursements = await Disbursement.find({recipient: req.user._id}).sort({createdAt: -1});

        const lastWeek = moment("YYYY-MM-DD").subtract(1, 'week');
        const lastMonth = moment("YYYY-MM-DD").subtract(1, 'month');
        const lastYear = moment("YYYY-MM-DD").subtract(1, 'year');

        const lastWeekContributions = [];
        let lastWeekContributionsCount = 0;
        let lastWeekContributionAmount = 0;

        let lastMonthContributionsCount = 0;
        const lastMonthContributions = [];
        let lastMonthContributionAmount = 0;

        const lastYearContributions = [];
        let lastYearContributionsCount = 0;
        let lastYearContributionAmount = 0;

        let contributionCurrency = null;

        let weekContributionData = [0, 0, 0, 0, 0, 0, 0];
        let monthContributionData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < allUserContributions.length; i++) {
            const contribution = allUserContributions[i];

            let week = moment(contribution.createdAt, 'YYYY-MM-DD').isoWeekday();
            weekContributionData[week] = weekContributionData[week] + contribution.amount.value;

            let month = moment(contribution.createdAt, 'YYYY-MM-DD').month();
            monthContributionData[month] = monthContributionData[month] + contribution.month.value;

            if (!contributionCurrency)
                contributionCurrency = contribution.amount.currency;

            if (lastWeek.isSameOrAfter(contribution.createdAt)) {
                lastWeekContributions.push(contribution);
                lastWeekContributionsCount++;
                lastWeekContributionAmount += contribution.amount.value;
            }

            if (lastMonth.isSameOrAfter(contribution.createdAt)) {
                lastMonthContributions.push(contribution);
                lastMonthContributionsCount++;
                lastMonthContributionAmount += contribution.amount.value;
            }

            if (lastYear.isSameOrAfter(contribution.createdAt)) {
                lastYearContributions.push(contribution);
                lastYearContributionsCount++;
                lastYearContributionAmount += contribution.amount.value;
            }

            totalContributionsAmount += contribution.amount.value;
        }

        const lastWeekDisbursements = [];
        let lastWeekDisbursementsCount = 0;
        let lastWeekDisbursementAmount = 0;

        let lastMonthDisbursementsCount = 0;
        const lastMonthDisbursements = [];
        let lastMonthDisbursementAmount = 0;

        const lastYearDisbursements = [];
        let lastYearDisbursementsCount = 0;
        let lastYearDisbursementAmount = 0;

        let disbursementCurrency = null;

        let weekDisbursementData = [0, 0, 0, 0, 0, 0, 0];
        let monthDisbursementData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < allUserContributions.length; i++) {
            const disbursement = allUserDisbursements[i];

            let week = moment(disbursement.createdAt, 'YYYY-MM-DD').isoWeekday();
            weekDisbursementData[week] = weekDisbursementData[week] + disbursement.amount.value;

            let month = moment(disbursement.createdAt, 'YYYY-MM-DD').month();
            monthDisbursementData[month] = monthDisbursementData[month] + disbursement.month.value;

            if (!disbursementCurrency)
                disbursementCurrency = disbursement.amount.currency;

            if (lastWeek.isSameOrAfter(disbursement.createdAt)) {
                lastWeekDisbursements.push(disbursement);
                lastWeekDisbursementsCount++;
                lastWeekDisbursementAmount += disbursement.amount.value;
            }

            if (lastMonth.isSameOrAfter(disbursement.createdAt)) {
                lastMonthDisbursements.push(disbursement);
                lastMonthDisbursementsCount++;
                lastMonthDisbursementAmount += disbursement.amount.value;
            }

            if (lastYear.isSameOrAfter(disbursement.createdAt)) {
                lastYearDisbursements.push(disbursement);
                lastYearDisbursementsCount++;
                lastYearDisbursementAmount += disbursement.amount.value;
            }
            totalDisbursementsAmount += disbursement.amount.value;
        }

        res.status(200).json({
            data: {
                invitations: {
                    totalInvitations,
                    acceptedInvitations: {
                        acceptedInvitationsCount: acceptedInvitations,
                        percentage: acceptancePercentage,
                    },
                    rejectedInvitations: {
                        rejectedInvitationsCount: rejectedInvitations,
                        percentage: rejectedPercentage,
                    },
                    expiredInvitations: {
                        expiredInvitationsCount: expiredInvitations,
                        percentage: expiredPercentage,
                    },
                },
                groups: {
                    totalUserGroups,
                },
                susu: {
                    totalUserSusu,
                },
                contributions: {
                    latestContributions,
                    totalContributions,
                    totalContributionsAmount,
                    contributionCurrency,
                    week: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        data: weekContributionData,
                        lastWeekContributions,
                        lastWeekContributionsCount,
                        lastWeekContributionAmount
                    },
                    month: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        data: monthContributionData,
                        lastMonthContributionsCount,
                        lastMonthContributions,
                        lastMonthContributionAmount
                    },
                    year: {
                        lastYearContributions,
                        lastYearContributionsCount,
                        lastYearContributionAmount
                    }
                },
                disbursements: {
                    latestDisbursements,
                    totalDisbursements,
                    totalDisbursementsAmount,
                    disbursementCurrency,
                    week: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        data: weekDisbursementData,
                        lastWeekDisbursements,
                        lastWeekDisbursementsCount,
                        lastWeekDisbursementAmount
                    },
                    month: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        data: monthContributionData,
                        lastMonthDisbursementsCount,
                        lastMonthDisbursements,
                        lastMonthDisbursementAmount
                    },
                    year: {
                        lastYearDisbursements,
                        lastYearDisbursementsCount,
                        lastYearDisbursementAmount
                    }
                }
            }
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
